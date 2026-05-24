import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const { phone } = await request.json()

  if (!phone) {
    return NextResponse.json(
      { error: 'Phone number is required' },
      { status: 400 }
    )
  }

  try {
    const supabase = await createClient()

    const { data, error } = await supabase.auth.signInWithOtp({
      phone,
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: 'OTP sent to your phone',
      data,
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to send OTP' },
      { status: 500 }
    )
  }
}
