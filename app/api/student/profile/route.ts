import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { validatePassword } from '@/lib/auth/password'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { data: profile, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, profile })
  } catch (error) {
    console.error('Profile fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const body = await request.json()
    const fullName = String(body.fullName || '').trim()
    const email = String(body.email || '').trim()
    const school = String(body.school || '').trim()
    const district = String(body.district || '').trim()
    const guardianPhone = String(body.guardianPhone || '').trim()
    const password = String(body.password || '')
    const confirmPassword = String(body.confirmPassword || '')

    if (!fullName || !district) {
      return NextResponse.json(
        { error: 'Full name and district are required' },
        { status: 400 }
      )
    }

    const { data: existingProfile } = await supabase
      .from('users')
      .select('password_set_at')
      .eq('id', user.id)
      .single()

    const isPasswordRequired = !existingProfile?.password_set_at

    if (isPasswordRequired || password) {
      const check = validatePassword(password)
      if (!check.valid) {
        return NextResponse.json({ error: check.error }, { status: 400 })
      }

      if (password !== confirmPassword) {
        return NextResponse.json(
          { error: 'Passwords do not match' },
          { status: 400 }
        )
      }

      const { error: passwordError } = await supabase.auth.updateUser({
        password,
      })

      if (passwordError) {
        return NextResponse.json({ error: passwordError.message }, { status: 500 })
      }
    }

    // profile_completed_at and password_set_at are no longer writable by the
    // authenticated role (see the column grants in the hardening migration), so
    // this write goes through the service role — scoped to the id we just
    // resolved from the session, never one supplied by the caller.
    const { error } = await createAdminClient()
      .from('users')
      .update({
        full_name: fullName,
        email: email || null,
        school: school || null,
        district,
        guardian_phone: guardianPhone || null,
        profile_completed_at: new Date().toISOString(),
        ...((isPasswordRequired || password) ? { password_set_at: new Date().toISOString() } : {})
      })
      .eq('id', user.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Profile update error:', error)
    return NextResponse.json(
      { error: 'Failed to save profile' },
      { status: 500 }
    )
  }
}
