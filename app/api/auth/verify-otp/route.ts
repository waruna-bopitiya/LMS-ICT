import { normalizePhoneNumber, phoneToAuthEmail } from '@/lib/auth/phone'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import {
  checkAllRateLimits,
  getClientIp,
  rateLimitResponse,
  recordRateLimitEvent,
} from '@/lib/rate-limit'
import crypto from 'crypto'
import { NextRequest, NextResponse } from 'next/server'

// Failures are counted per phone number over a window rather than per OTP row.
// A per-row counter resets every time a new code is requested, which hands an
// attacker a fresh budget of guesses for the price of one SMS.
const MAX_FAILURES = 5
const FAILURE_WINDOW_SECONDS = 900

export async function POST(request: NextRequest) {
  try {
    const { phone, token } = await request.json()

    if (!phone || !token) {
      return NextResponse.json(
        { error: 'Phone and token are required' },
        { status: 400 }
      )
    }

    const normalizedPhone = normalizePhoneNumber(phone)

    if (!normalizedPhone) {
      return NextResponse.json({ error: 'Invalid OTP' }, { status: 400 })
    }

    const ip = getClientIp(request)

    const limit = await checkAllRateLimits([
      { bucket: 'otp:verify:fail', subject: normalizedPhone, limit: MAX_FAILURES, windowSeconds: FAILURE_WINDOW_SECONDS },
      { bucket: 'otp:verify:fail:ip', subject: ip, limit: 20, windowSeconds: FAILURE_WINDOW_SECONDS },
    ])

    if (!limit.allowed) {
      return rateLimitResponse(
        limit.retryAfter,
        'Too many incorrect codes. Please wait 15 minutes and request a new one.'
      )
    }

    const admin = createAdminClient()
    const otpHash = crypto.createHash('sha256').update(String(token)).digest('hex')

    const { data: otpRow, error: otpError } = await admin
      .from('otp_codes')
      .select('*')
      .eq('phone_number', normalizedPhone)
      .is('verified_at', null)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (otpError || !otpRow) {
      await recordRateLimitEvent('otp:verify:fail', normalizedPhone)
      await recordRateLimitEvent('otp:verify:fail:ip', ip)
      return NextResponse.json({ error: 'OTP has expired' }, { status: 400 })
    }

    const submitted = Buffer.from(otpHash, 'hex')
    const expected = Buffer.from(otpRow.otp_hash, 'hex')
    const matches =
      submitted.length === expected.length &&
      crypto.timingSafeEqual(submitted, expected)

    if (!matches) {
      await admin
        .from('otp_codes')
        .update({ attempts: otpRow.attempts + 1 })
        .eq('id', otpRow.id)

      await recordRateLimitEvent('otp:verify:fail', normalizedPhone)
      await recordRateLimitEvent('otp:verify:fail:ip', ip)

      return NextResponse.json({ error: 'Invalid OTP' }, { status: 400 })
    }

    // Burn the code before doing anything else, so it cannot be replayed by a
    // concurrent request while the account work below is still running.
    const { data: burned } = await admin
      .from('otp_codes')
      .update({ verified_at: new Date().toISOString() })
      .eq('id', otpRow.id)
      .is('verified_at', null)
      .select('id')
      .maybeSingle()

    if (!burned) {
      return NextResponse.json({ error: 'OTP has expired' }, { status: 400 })
    }

    const email = phoneToAuthEmail(normalizedPhone)
    const password = crypto.randomBytes(24).toString('base64url')

    const { data: existingProfile } = await admin
      .from('users')
      .select('id')
      .eq('phone_number', normalizedPhone)
      .maybeSingle()

    let userId = existingProfile?.id

    if (!userId) {
      const { data: created, error: createError } =
        await admin.auth.admin.createUser({
          email,
          phone: normalizedPhone,
          password,
          email_confirm: true,
          phone_confirm: true,
          user_metadata: { phone_number: normalizedPhone },
        })

      if (createError || !created?.user) {
        // The auth user can outlive its public.users row. Find it and reuse it
        // rather than failing the login.
        const foundAuthUser = await findAuthUserByEmail(admin, email, normalizedPhone)

        if (foundAuthUser) {
          userId = foundAuthUser.id
          await admin.auth.admin.updateUserById(userId, {
            email,
            password,
            email_confirm: true,
            phone_confirm: true,
          })
        } else {
          console.error('Failed to create auth user:', createError?.message)
          return NextResponse.json(
            { error: 'Failed to create account' },
            { status: 500 }
          )
        }
      } else {
        userId = created.user.id
      }
    } else {
      const { error: updateError } = await admin.auth.admin.updateUserById(
        userId,
        {
          email,
          phone: normalizedPhone,
          password,
          email_confirm: true,
          phone_confirm: true,
        }
      )

      if (updateError) {
        console.error('Failed to update auth user:', updateError.message)
        return NextResponse.json({ error: 'Failed to sign in' }, { status: 500 })
      }
    }

    await admin.from('users').upsert(
      {
        id: userId,
        phone_number: normalizedPhone,
        is_admin: false,
      },
      { onConflict: 'id', ignoreDuplicates: true }
    )

    const supabase = await createClient()
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      console.error('Sign-in after OTP failed:', error.message)
      return NextResponse.json({ error: 'Failed to sign in' }, { status: 400 })
    }

    // The session is carried by the auth cookies that signInWithPassword just
    // set on this response. Returning the tokens in the body as well would put
    // them within reach of any script on the page.
    return NextResponse.json({
      success: true,
      message: 'OTP verified successfully',
    })
  } catch (error) {
    console.error('Verify OTP error:', error)
    return NextResponse.json(
      { error: 'Failed to verify OTP' },
      { status: 500 }
    )
  }
}

type AdminClient = ReturnType<typeof createAdminClient>

/** Pages through auth users; listUsers defaults to a single page of 50. */
async function findAuthUserByEmail(
  admin: AdminClient,
  email: string,
  phone: string
) {
  const perPage = 1000
  const maxPages = 20

  for (let page = 1; page <= maxPages; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage })
    if (error || !data?.users?.length) return null

    const found = data.users.find(
      u =>
        u.email === email ||
        u.phone === phone ||
        u.user_metadata?.phone_number === phone
    )
    if (found) return found

    if (data.users.length < perPage) return null
  }

  return null
}
