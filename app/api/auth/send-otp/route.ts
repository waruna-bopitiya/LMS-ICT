import { normalizePhoneNumber } from '@/lib/auth/phone'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendFitsms } from '@/lib/sms/fitsms'
import crypto from 'crypto'
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
    const normalizedPhone = normalizePhoneNumber(phone)
    const otp = crypto.randomInt(100000, 999999).toString()
    const otpHash = crypto.createHash('sha256').update(otp).digest('hex')
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString()
    const supabase = createAdminClient()

    const { error } = await supabase.from('otp_codes').insert({
      phone_number: normalizedPhone,
      otp_hash: otpHash,
      expires_at: expiresAt,
      attempts: 0,
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    await sendFitsms({
      to: normalizedPhone,
      message: `Your LMS verification code is ${otp}. It expires in 5 minutes.`,
    })

    return NextResponse.json({
      success: true,
      message: 'OTP sent to your phone',
      phone: normalizedPhone,
    })
  } catch (error) {
    console.error('Send OTP error:', error)
    return NextResponse.json(
      { error: 'Failed to send OTP' },
      { status: 500 }
    )
  }
}
