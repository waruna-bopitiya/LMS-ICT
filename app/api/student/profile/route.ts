import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

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

    if (!password || password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      )
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

    const { error } = await supabase
      .from('users')
      .update({
        full_name: fullName,
        email: email || null,
        school: school || null,
        district,
        guardian_phone: guardianPhone || null,
        profile_completed_at: new Date().toISOString(),
        password_set_at: new Date().toISOString(),
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
