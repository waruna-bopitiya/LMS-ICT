import { createClient } from '@/lib/supabase/server'
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
    const supabase = await createClient()

    const { data, error } = await supabase.auth.verifyOtp({
      phone,
      token,
      type: 'sms',
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // Create user profile if it doesn't exist
    if (data.user) {
      const { error: profileError } = await supabase.from('users').insert({
        id: data.user.id,
        phone_number: phone,
        full_name: '',
        is_admin: false,
      }).on('CONFLICT', 'IGNORE')

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Profile creation error:', profileError)
      }
    }

    return NextResponse.json({
      success: true,
      message: 'OTP verified successfully',
      user: data.user,
      session: data.session,
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to verify OTP' },
      { status: 500 }
    )
  }
}
