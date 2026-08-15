import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { validatePassword } from '@/lib/auth/password'
import { phoneToAuthEmail } from '@/lib/auth/phone'
import { sendFitsms } from '@/lib/sms/fitsms'
import { NextRequest, NextResponse } from 'next/server'

// A session alone must not be enough to take permanent ownership of an account.
// The caller proves intent either with the current password, or with an OTP
// verified in the last few minutes (the forgot-password path).
const RECENT_OTP_SECONDS = 600

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { password, currentPassword } = await request.json()

    const check = validatePassword(password)
    if (!check.valid) {
      return NextResponse.json({ error: check.error }, { status: 400 })
    }

    const admin = createAdminClient()

    const { data: profile } = await admin
      .from('users')
      .select('phone_number, password_set_at')
      .eq('id', user.id)
      .single()

    if (!profile?.phone_number) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // First-time setup has nothing to re-authenticate against.
    const isFirstTimeSetup = !profile.password_set_at

    if (!isFirstTimeSetup) {
      const since = new Date(Date.now() - RECENT_OTP_SECONDS * 1000).toISOString()

      const { data: recentOtp } = await admin
        .from('otp_codes')
        .select('id')
        .eq('phone_number', profile.phone_number)
        .not('verified_at', 'is', null)
        .gte('verified_at', since)
        .limit(1)
        .maybeSingle()

      if (!recentOtp) {
        if (!currentPassword) {
          return NextResponse.json(
            { error: 'Enter your current password to change it' },
            { status: 400 }
          )
        }

        const { error: reauthError } = await admin.auth.signInWithPassword({
          email: phoneToAuthEmail(profile.phone_number),
          password: currentPassword,
        })

        if (reauthError) {
          return NextResponse.json(
            { error: 'Current password is incorrect' },
            { status: 401 }
          )
        }
      }
    }

    const { error: authError } = await supabase.auth.updateUser({ password })
    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 500 })
    }

    const { error: dbError } = await admin
      .from('users')
      .update({ password_set_at: new Date().toISOString() })
      .eq('id', user.id)

    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 500 })
    }

    // Tell the account owner out-of-band, so a change they did not make is
    // visible to them rather than silent.
    if (!isFirstTimeSetup) {
      try {
        await sendFitsms({
          to: profile.phone_number,
          message:
            'Your I See ICT password was just changed. If this was not you, contact us immediately.',
        })
      } catch (smsError) {
        console.error('Password change notification failed:', smsError)
      }
    }

    return NextResponse.json({ success: true, message: 'Password updated successfully' })
  } catch (error) {
    console.error('Reset password error:', error)
    return NextResponse.json({ error: 'Failed to reset password' }, { status: 500 })
  }
}
