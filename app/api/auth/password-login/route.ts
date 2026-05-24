import { normalizePhoneNumber, phoneToAuthEmail } from '@/lib/auth/phone'
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { phone, password } = await request.json()

    if (!phone || !password) {
      return NextResponse.json(
        { error: 'Phone number and password are required' },
        { status: 400 }
      )
    }

    const normalizedPhone = normalizePhoneNumber(phone)
    const supabase = await createClient()
    const { data, error } = await supabase.auth.signInWithPassword({
      email: phoneToAuthEmail(normalizedPhone),
      password,
    })

    if (error) {
      return NextResponse.json(
        { error: 'Invalid phone number or password' },
        { status: 401 }
      )
    }

    return NextResponse.json({
      success: true,
      user: data.user,
      session: data.session,
    })
  } catch (error) {
    console.error('Password login error:', error)
    return NextResponse.json({ error: 'Failed to login' }, { status: 500 })
  }
}
