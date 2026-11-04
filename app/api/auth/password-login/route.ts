import { normalizePhoneNumber, phoneToAuthEmail } from '@/lib/auth/phone'
import { createClient } from '@/lib/supabase/server'
import {
  checkAllRateLimits,
  getClientIp,
  rateLimitResponse,
  recordRateLimitEvent,
} from '@/lib/rate-limit'
import { NextRequest, NextResponse } from 'next/server'
import { createClient as createStatelessClient } from '@supabase/supabase-js'
import { partnerOrigin, partnerTokenResponse, preflight, withCors } from '@/lib/cors'

async function handle(request: NextRequest) {
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

    const partner = partnerOrigin(request)
    // For a partner site, check the password without touching this site's cookies.
    const supabase = partner
      ? createStatelessClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
          auth: { autoRefreshToken: false, persistSession: false },
        })
      : await createClient()
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

    if (partner) return partnerTokenResponse(request, phoneToAuthEmail(normalizedPhone))

    // Session travels in the auth cookies set on this response, not the body.
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Password login error:', error)
    return NextResponse.json({ error: 'Failed to login' }, { status: 500 })
  }
}

// Also callable from partner sites such as seminar.iseeict.com.
export const OPTIONS = preflight

export async function POST(request: NextRequest) {
  return withCors(request, await handle(request))
}
