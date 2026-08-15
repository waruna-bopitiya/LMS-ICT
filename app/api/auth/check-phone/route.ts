import { normalizePhoneNumber } from '@/lib/auth/phone'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  checkAllRateLimits,
  getClientIp,
  rateLimitResponse,
  recordRateLimitEvent,
} from '@/lib/rate-limit'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { phone } = await request.json()

    if (!phone) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 })
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
      { bucket: 'auth:check-phone:ip', subject: ip, limit: 20, windowSeconds: 3600 },
    ])

    if (!limit.allowed) {
      return rateLimitResponse(limit.retryAfter, 'Too many requests. Please try again later.')
    }

    await recordRateLimitEvent('auth:check-phone:ip', ip)

    const admin = createAdminClient()

    // Exact match on the normalized form. The previous last-9-digits LIKE was
    // both an enumeration aid and a correctness hazard — it can match the wrong
    // student once numbers overlap.
    const { data: profile } = await admin
      .from('users')
      .select('profile_completed_at, password_set_at')
      .eq('phone_number', normalizedPhone)
      .maybeSingle()

    // The response shape is identical whether or not the number is registered.
    // Only whether a password has actually been set is revealed, which the
    // login form needs to decide which field to show, and which an attacker
    // cannot turn into a roster of accounts.
    return NextResponse.json({
      phone: normalizedPhone,
      canLoginWithPassword: Boolean(
        profile?.profile_completed_at && profile?.password_set_at
      ),
    })
  } catch (error) {
    console.error('Check phone error:', error)
    return NextResponse.json({ error: 'Failed to check phone number' }, { status: 500 })
  }
}
