import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { startEnrollmentAttempt } from '@/lib/enrollment'
import { getSiteUrl } from '@/lib/site-url'
import { NextResponse } from 'next/server'
import crypto from 'crypto'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized: Authentication required' }, { status: 401 })
    }

    const body = await request.json()
    const { courseId } = body

    if (!courseId) {
      return NextResponse.json({ error: 'Missing course ID' }, { status: 400 })
    }

    const merchantId = process.env.NEXT_PUBLIC_PAYHERE_MERCHANT_ID
    const merchantSecret = process.env.PAYHERE_MERCHANT_SECRET
    const isSandbox = process.env.NEXT_PUBLIC_PAYHERE_IS_SANDBOX === 'true'
    const currency = 'LKR'

    if (!merchantId || !merchantSecret) {
      console.error('PayHere configuration missing in server environment')
      return NextResponse.json({ error: 'Payment gateway configuration error' }, { status: 500 })
    }

    // Creates the pending payment and re-points the enrollment at it, so a
    // retry after an abandoned checkout still activates on callback.
    const attempt = await startEnrollmentAttempt(user.id, courseId, null)

    if (!attempt.ok) {
      return NextResponse.json({ error: attempt.error }, { status: attempt.status })
    }

    const formattedAmount = attempt.coursePrice.toFixed(2)

    const { data: profile } = await createAdminClient()
      .from('users')
      .select('full_name, phone_number')
      .eq('id', user.id)
      .maybeSingle()

    // uppercase(md5(merchant_id + order_id + amount + currency + uppercase(md5(secret))))
    const hashedSecret = crypto.createHash('md5').update(merchantSecret).digest('hex').toUpperCase()
    const hashString = merchantId + attempt.paymentId + formattedAmount + currency + hashedSecret
    const finalHash = crypto.createHash('md5').update(hashString).digest('hex').toUpperCase()

    const names = (profile?.full_name || 'Student User').trim().split(/\s+/)
    const firstName = names[0] || 'Student'
    const lastName = names.slice(1).join(' ') || 'User'

    // Callback and redirect targets are derived server-side, never taken from
    // the browser's window.location.
    const siteUrl = getSiteUrl()

    return NextResponse.json({
      success: true,
      sandbox: isSandbox,
      merchantId,
      orderId: attempt.paymentId,
      returnUrl: `${siteUrl}/student/payment/return?payment=${attempt.paymentId}`,
      cancelUrl: `${siteUrl}/student/payment/return?payment=${attempt.paymentId}&cancelled=1`,
      notifyUrl: `${siteUrl}/api/payments/payhere/notify`,
      amount: formattedAmount,
      currency,
      hash: finalHash,
      items: attempt.courseTitle,
      customer: {
        firstName,
        lastName,
        email: user.email || 'student@iseeict.lk',
        phone: profile?.phone_number || '0777777777',
        address: 'No 1, Main Road',
        city: 'Colombo',
        country: 'Sri Lanka'
      },
      custom1: user.id,
      custom2: courseId
    })
  } catch (err) {
    console.error('Checkout API error:', err)
    return NextResponse.json({ error: 'An error occurred during checkout' }, { status: 500 })
  }
}
