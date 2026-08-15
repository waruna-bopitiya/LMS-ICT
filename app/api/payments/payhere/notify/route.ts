import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import crypto from 'crypto'

export async function POST(request: Request) {
  try {
    // PayHere sends data as application/x-www-form-urlencoded
    const formData = await request.formData()

    const merchantId = formData.get('merchant_id') as string
    const orderId = formData.get('order_id') as string
    const paymentId = formData.get('payment_id') as string
    const payhereAmount = formData.get('payhere_amount') as string
    const payhereCurrency = formData.get('payhere_currency') as string
    const statusCode = formData.get('status_code') as string
    const md5sig = formData.get('md5sig') as string

    if (!merchantId || !orderId || !payhereAmount || !payhereCurrency || !statusCode || !md5sig) {
      console.error('Invalid PayHere notify payload: missing required fields')
      return NextResponse.json({ error: 'Invalid payload parameters' }, { status: 400 })
    }

    const localMerchantSecret = process.env.PAYHERE_MERCHANT_SECRET
    const configuredMerchantId = process.env.NEXT_PUBLIC_PAYHERE_MERCHANT_ID

    if (!localMerchantSecret || !configuredMerchantId) {
      console.error('PayHere configuration missing on the server')
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    // The callback must be for our own merchant account, not merely one that
    // produces a valid-looking signature shape.
    if (merchantId !== configuredMerchantId) {
      console.error('PayHere notify for an unexpected merchant id')
      return NextResponse.json({ error: 'Signature verification failed' }, { status: 401 })
    }

    // uppercase(md5(merchant_id + order_id + payhere_amount + payhere_currency + status_code + uppercase(md5(merchant_secret))))
    const hashedSecret = crypto.createHash('md5').update(localMerchantSecret).digest('hex').toUpperCase()
    const hashString = merchantId + orderId + payhereAmount + payhereCurrency + statusCode + hashedSecret
    const computedSignature = crypto.createHash('md5').update(hashString).digest('hex').toUpperCase()

    if (!timingSafeEqualHex(computedSignature, md5sig.toUpperCase())) {
      // Do not log either signature — a verification oracle in the logs is
      // worth more to an attacker than the failure notice is to us.
      console.error('PayHere signature mismatch for order', orderId)
      return NextResponse.json({ error: 'Signature verification failed' }, { status: 401 })
    }

    const admin = createAdminClient()

    const { data: payment, error: lookupError } = await admin
      .from('payments')
      .select('id, amount, status, course_id, user_id')
      .eq('id', orderId)
      .maybeSingle()

    if (lookupError || !payment) {
      console.error('PayHere notify for unknown order', orderId)
      return NextResponse.json({ error: 'Unknown order' }, { status: 404 })
    }

    // Status code '2' indicates success
    if (statusCode === '2') {
      // Reconcile the amount before granting anything. A mismatch means the
      // charge does not correspond to what this enrolment costs, and the right
      // response is to stop rather than to activate.
      const paidAmount = Number(payhereAmount)
      const expectedAmount = Number(payment.amount)

      if (
        !Number.isFinite(paidAmount) ||
        Math.abs(paidAmount - expectedAmount) > 0.01 ||
        payhereCurrency !== 'LKR'
      ) {
        console.error(
          `PayHere amount mismatch on order ${orderId}: paid ${payhereAmount} ${payhereCurrency}, expected ${expectedAmount} LKR`
        )
        return NextResponse.json({ error: 'Amount mismatch' }, { status: 400 })
      }

      // Idempotent: PayHere retries callbacks, and a repeat must not re-run.
      if (payment.status === 'approved') {
        return new Response('OK', { status: 200 })
      }

      const { error: paymentError } = await admin
        .from('payments')
        .update({
          status: 'approved',
          bank_slip_url: `PayHere Ref: ${paymentId}`,
        })
        .eq('id', orderId)

      if (paymentError) {
        console.error(`Failed to approve payment record ${orderId}:`, paymentError.message)
        return NextResponse.json({ error: 'Failed to update payment status' }, { status: 500 })
      }

      const { error: enrollmentError } = await admin
        .from('enrollments')
        .update({ status: 'active' })
        .eq('payment_id', orderId)

      if (enrollmentError) {
        console.error(`Failed to activate enrollment for payment ${orderId}:`, enrollmentError.message)
        return NextResponse.json({ error: 'Failed to activate enrollment' }, { status: 500 })
      }

      console.log(`Payment approved and enrolment activated for order ${orderId}`)
    } else if (['0', '-1', '-2', '-3'].includes(statusCode)) {
      await admin
        .from('payments')
        .update({ status: 'rejected' })
        .eq('id', orderId)
    }

    // Acknowledge receipt to PayHere
    return new Response('OK', { status: 200 })
  } catch (err) {
    console.error('Notification API Error:', err)
    return NextResponse.json({ error: 'Callback processing failed' }, { status: 500 })
  }
}

function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  try {
    return crypto.timingSafeEqual(Buffer.from(a, 'utf8'), Buffer.from(b, 'utf8'))
  } catch {
    return false
  }
}
