import { normalizePhoneNumber, phoneToAuthEmail } from '@/lib/auth/phone'
import { createClient } from '@/lib/supabase/server'
import {
  checkAllRateLimits,
  getClientIp,
  rateLimitResponse,
  recordRateLimitEvent,
} from '@/lib/rate-limit'
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

    if (!normalizedPhone) {
      return NextResponse.json(
        { error: 'Invalid phone number or password' },
        { status: 401 }
      )
    }

    const ip = getClientIp(request)

    const limit = await checkAllRateLimits([
      { bucket: 'auth:login:fail', subject: normalizedPhone, limit: 10, windowSeconds: 900 },
      { bucket: 'auth:login:fail:ip', subject: ip, limit: 30, windowSeconds: 900 },
    ])

    if (!limit.allowed) {
      return rateLimitResponse(
        limit.retryAfter,
        'Too many failed sign-in attempts. Please wait 15 minutes and try again.'
      )
    }

    const supabase = await createClient()
    const { error } = await supabase.auth.signInWithPassword({
      email: phoneToAuthEmail(normalizedPhone),
      password,
    })

    if (error) {
      await recordRateLimitEvent('auth:login:fail', normalizedPhone)
      await recordRateLimitEvent('auth:login:fail:ip', ip)

      return NextResponse.json(
        { error: 'Invalid phone number or password' },
        { status: 401 }
      )
    }

    // Session travels in the auth cookies set on this response, not the body.
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Password login error:', error)
    return NextResponse.json({ error: 'Failed to login' }, { status: 500 })
  }
}
