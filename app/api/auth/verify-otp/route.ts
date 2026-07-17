import { normalizePhoneNumber, phoneToAuthEmail } from '@/lib/auth/phone'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import crypto from 'crypto'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const { phone, token } = await request.json()

  if (!phone || !token) {
    return NextResponse.json(
      { error: 'Phone and token are required' },
      { status: 400 }
    )
  }

  try {
    const normalizedPhone = normalizePhoneNumber(phone)
    const admin = createAdminClient()
    const otpHash = crypto.createHash('sha256').update(token).digest('hex')

    const { data: otpRow, error: otpError } = await admin
      .from('otp_codes')
      .select('*')
      .eq('phone_number', normalizedPhone)
      .is('verified_at', null)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (otpError || !otpRow) {
      return NextResponse.json({ error: 'OTP has expired' }, { status: 400 })
    }

    if (otpRow.attempts >= 5) {
      return NextResponse.json(
        { error: 'Too many attempts. Please request a new OTP.' },
        { status: 429 }
      )
    }

    if (otpRow.otp_hash !== otpHash) {
      await admin
        .from('otp_codes')
        .update({ attempts: otpRow.attempts + 1 })
        .eq('id', otpRow.id)

      return NextResponse.json({ error: 'Invalid OTP' }, { status: 400 })
    }

    const email = phoneToAuthEmail(normalizedPhone)
    const password = crypto.randomBytes(24).toString('base64url')

    const { data: existingProfile } = await admin
      .from('users')
      .select('id, password_set_at, profile_completed_at')
      .eq('phone_number', normalizedPhone)
      .maybeSingle()

    let userId = existingProfile?.id

    if (!userId) {
      const { data: created, error: createError } =
        await admin.auth.admin.createUser({
          email,
          phone: normalizedPhone,
          password,
          email_confirm: true,
          phone_confirm: true,
          user_metadata: { phone_number: normalizedPhone },
        })

      if (createError || !created.user) {
        return NextResponse.json(
          { error: createError?.message || 'Failed to create user' },
          { status: 500 }
        )
      }

      userId = created.user.id
    } else {
      const { error: updateError } = await admin.auth.admin.updateUserById(
        userId,
        {
          email,
          phone: normalizedPhone,
          password,
          email_confirm: true,
          phone_confirm: true,
        }
      )

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 })
      }
    }

    await admin.from('users').upsert(
      {
        id: userId,
        phone_number: normalizedPhone,
        is_admin: false,
      },
      { onConflict: 'id', ignoreDuplicates: true }
    )

    await admin
      .from('otp_codes')
      .update({ verified_at: new Date().toISOString() })
      .eq('id', otpRow.id)

    const supabase = await createClient()
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: 'OTP verified successfully',
      user: data.user,
      session: data.session,
    })
  } catch (error) {
    console.error('Verify OTP error:', error)
    return NextResponse.json(
      { error: 'Failed to verify OTP' },
      { status: 500 }
    )
  }
}
