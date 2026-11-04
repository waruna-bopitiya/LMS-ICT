import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

// Sibling sites that log students in through this site's auth API.
// They run on their own origin, so they get a single-use sign-in token to
// redeem with supabase.auth.verifyOtp instead of this site's cookies.
const ALLOWED = (process.env.PARTNER_ORIGINS || 'https://seminar.iseeict.com')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean)

/** The calling origin when it is an allowed partner site, otherwise null. */
export const partnerOrigin = (request: Request) => {
  const origin = request.headers.get('origin')
  return origin && ALLOWED.includes(origin) ? origin : null
}

const corsHeaders = (origin: string) => ({
  'Access-Control-Allow-Origin': origin,
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '600',
  Vary: 'Origin',
})

/** Preflight response for the partner-facing auth routes. */
export const preflight = (request: Request) => {
  const origin = partnerOrigin(request)
  return origin ? new Response(null, { status: 204, headers: corsHeaders(origin) }) : new Response(null, { status: 403 })
}

/** Adds CORS headers to a response when the request came from a partner site. */
export const withCors = (request: Request, response: Response) => {
  const origin = partnerOrigin(request)
  if (origin) Object.entries(corsHeaders(origin)).forEach(([k, v]) => response.headers.set(k, v))
  return response
}

/** Single-use magic-link token for an account, for a partner site to redeem. */
export async function partnerSignInToken(email: string) {
  const { data, error } = await createAdminClient().auth.admin.generateLink({ type: 'magiclink', email })
  if (error || !data?.properties?.hashed_token) return null
  return data.properties.hashed_token
}

export const partnerTokenResponse = async (request: Request, email: string) => {
  const token_hash = await partnerSignInToken(email)
  return withCors(
    request,
    token_hash
      ? NextResponse.json({ success: true, token_hash })
      : NextResponse.json({ error: 'Failed to sign in' }, { status: 500 })
  )
}
