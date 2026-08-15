import { createAdminClient } from '@/lib/supabase/admin'
import type { NextRequest } from 'next/server'

export type RateLimitRule = {
  /** Logical counter name, e.g. 'otp:send'. */
  bucket: string
  /** Who is being counted: a phone number, an IP, or 'global'. */
  subject: string
  /** Maximum events allowed inside the window. */
  limit: number
  /** Window length in seconds. */
  windowSeconds: number
}

export type RateLimitResult = {
  allowed: boolean
  /** Seconds until the caller may try again, when blocked. */
  retryAfter: number
}

/**
 * Postgres-backed sliding window. There is no Redis in this stack, and the
 * volumes here (OTP sends, login attempts) are far below the point where a
 * table would struggle.
 *
 * Fails closed: if the counter cannot be read we block rather than let an
 * unbounded number of billed SMS through.
 */
export async function checkRateLimit(
  rule: RateLimitRule
): Promise<RateLimitResult> {
  const admin = createAdminClient()
  const windowStart = new Date(
    Date.now() - rule.windowSeconds * 1000
  ).toISOString()

  const { count, error } = await admin
    .from('rate_limits')
    .select('id', { count: 'exact', head: true })
    .eq('bucket', rule.bucket)
    .eq('subject', rule.subject)
    .gte('created_at', windowStart)

  if (error) {
    console.error(`Rate limit check failed for ${rule.bucket}:`, error.message)
    return { allowed: false, retryAfter: rule.windowSeconds }
  }

  if ((count ?? 0) >= rule.limit) {
    return { allowed: false, retryAfter: rule.windowSeconds }
  }

  return { allowed: true, retryAfter: 0 }
}

/** Records one event against a counter. Call after a successful action. */
export async function recordRateLimitEvent(bucket: string, subject: string) {
  const admin = createAdminClient()
  const { error } = await admin
    .from('rate_limits')
    .insert({ bucket, subject })

  if (error) {
    console.error(`Failed to record rate limit event for ${bucket}:`, error.message)
  }
}

/**
 * Checks every rule and returns the first that blocks. Used where a request is
 * limited on several axes at once — per phone, per IP, and platform-wide.
 */
export async function checkAllRateLimits(
  rules: RateLimitRule[]
): Promise<RateLimitResult> {
  for (const rule of rules) {
    const result = await checkRateLimit(rule)
    if (!result.allowed) return result
  }
  return { allowed: true, retryAfter: 0 }
}

/**
 * Best-effort client IP. Behind Vercel, x-forwarded-for is set by the platform;
 * the leftmost entry is the client. Falls back to a constant, which means
 * unidentifiable callers share one bucket rather than escaping the limit.
 */
export function getClientIp(request: NextRequest | Request): string {
  const headers = request.headers
  const forwarded = headers.get('x-forwarded-for')
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim()
    if (first) return first
  }
  return headers.get('x-real-ip')?.trim() || 'unknown'
}

export function rateLimitResponse(retryAfter: number, message: string) {
  return new Response(JSON.stringify({ error: message }), {
    status: 429,
    headers: {
      'Content-Type': 'application/json',
      'Retry-After': String(retryAfter),
    },
  })
}
