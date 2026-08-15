import { normalizePhoneNumber } from '@/lib/auth/phone'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendFitsms } from '@/lib/sms/fitsms'
import {
  checkAllRateLimits,
  getClientIp,
  rateLimitResponse,
  recordRateLimitEvent,
} from '@/lib/rate-limit'
import crypto from 'crypto'
import { NextRequest, NextResponse } from 'next/server'

// Each send costs real money and rings a real phone, so the endpoint is limited
// on three axes: the number being messaged, the caller, and the platform as a
// whole. The global cap is a circuit breaker — it bounds the worst case even if
// an attacker rotates both numbers and IPs.
const COOLDOWN_SECONDS = 60
const PER_PHONE_HOURLY = 3
const PER_PHONE_DAILY = 10
const PER_IP_HOURLY = 10
const GLOBAL_HOURLY = 200

export async function POST(request: NextRequest) {
  try {
    const { phone } = await request.json()

    if (!phone) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      )
    }

    const normalizedPhone = normalizePhoneNumber(phone)

    if (!normalizedPhone) {
      return NextResponse.json(
        { error: 'Enter a valid Sri Lankan mobile number, for example 0771234567' },
        { status: 400 }
      )
    }

    const ip = getClientIp(request)

    const limit = await checkAllRateLimits([
      { bucket: 'otp:send:cooldown', subject: normalizedPhone, limit: 1, windowSeconds: COOLDOWN_SECONDS },
      { bucket: 'otp:send', subject: normalizedPhone, limit: PER_PHONE_HOURLY, windowSeconds: 3600 },
      { bucket: 'otp:send', subject: normalizedPhone, limit: PER_PHONE_DAILY, windowSeconds: 86400 },
      { bucket: 'otp:send:ip', subject: ip, limit: PER_IP_HOURLY, windowSeconds: 3600 },
      { bucket: 'otp:send:global', subject: 'global', limit: GLOBAL_HOURLY, windowSeconds: 3600 },
    ])

    if (!limit.allowed) {
      return rateLimitResponse(
        limit.retryAfter,
        'Too many verification codes requested. Please wait before trying again.'
      )
    }

    const otp = crypto.randomInt(100000, 1000000).toString()
    const otpHash = crypto.createHash('sha256').update(otp).digest('hex')
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString()
    const supabase = createAdminClient()

    // Retire any code still outstanding for this number. Without this, older
    // unexpired codes stay valid but are never the row that verification reads.
    await supabase
      .from('otp_codes')
      .update({ verified_at: new Date().toISOString() })
      .eq('phone_number', normalizedPhone)
      .is('verified_at', null)

    const { error } = await supabase.from('otp_codes').insert({
      phone_number: normalizedPhone,
      otp_hash: otpHash,
      expires_at: expiresAt,
      attempts: 0,
    })

    if (error) {
      console.error('Failed to store OTP:', error.message)
      return NextResponse.json({ error: 'Failed to send OTP' }, { status: 500 })
    }

    await Promise.all([
      recordRateLimitEvent('otp:send:cooldown', normalizedPhone),
      recordRateLimitEvent('otp:send', normalizedPhone),
      recordRateLimitEvent('otp:send:ip', ip),
      recordRateLimitEvent('otp:send:global', 'global'),
    ])

    await sendFitsms({
      to: normalizedPhone,
      message: `Your ICT Class verification code is ${otp}. It expires in 5 minutes. Congratulations and well done for completing your step!`,
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
