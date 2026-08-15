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
    const userId = formData.get('custom_1') as string
    const courseId = formData.get('custom_2') as string

    if (!merchantId || !orderId || !payhereAmount || !payhereCurrency || !statusCode || !md5sig) {
      console.error('Invalid PayHere notify payload:', Object.fromEntries(formData.entries()))
      return NextResponse.json({ error: 'Invalid payload parameters' }, { status: 400 })
    }

    const localMerchantSecret = process.env.PAYHERE_MERCHANT_SECRET
    if (!localMerchantSecret) {
      console.error('PAYHERE_MERCHANT_SECRET is not configured on the server')
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    // Verify signature integrity:
    // uppercase(md5(merchant_id + order_id + payhere_amount + payhere_currency + status_code + uppercase(md5(merchant_secret))))
    const hashedSecret = crypto.createHash('md5').update(localMerchantSecret).digest('hex').toUpperCase()
    const hashString = merchantId + orderId + payhereAmount + payhereCurrency + statusCode + hashedSecret
    const computedSignature = crypto.createHash('md5').update(hashString).digest('hex').toUpperCase()

    if (computedSignature !== md5sig.toUpperCase()) {
      console.error('PayHere signature mismatch! Security alert.')
      console.error('Received:', md5sig)
      console.error('Computed:', computedSignature)
      return NextResponse.json({ error: 'Signature verification failed' }, { status: 401 })
    }

    const admin = createAdminClient()

    // Status code '2' indicates success
    if (statusCode === '2') {
      console.log(`Payment success for Order ID: ${orderId}, Amount: ${payhereAmount} LKR`)

      // 1. Update payment status to approved
      const { error: paymentError } = await admin
        .from('payments')
        .update({
          status: 'approved',
          bank_slip_url: `PayHere Ref: ${paymentId}` // store PayHere transaction ID as reference
        })
        .eq('id', orderId)

      if (paymentError) {
        console.error(`Failed to approve payment record ${orderId}:`, paymentError)
        return NextResponse.json({ error: 'Failed to update payment status' }, { status: 500 })
      }

      // 2. Activate student enrollment
      const { error: enrollmentError } = await admin
        .from('enrollments')
        .update({
          status: 'active'
        })
        .eq('payment_id', orderId)

      if (enrollmentError) {
        console.error(`Failed to activate enrollment for payment ${orderId}:`, enrollmentError)
        return NextResponse.json({ error: 'Failed to activate enrollment' }, { status: 500 })
      }

      console.log(`Enrollment activated successfully for user ${userId} on class ${courseId}`)
    } else {
      console.log(`Payment transaction status received: ${statusCode} for Order ID: ${orderId}`)
      
      // Update payment status to rejected if failed
      if (['0', '-1', '-2', '-3'].includes(statusCode)) {
        await admin
          .from('payments')
          .update({ status: 'rejected' })
          .eq('id', orderId)
      }
    }

    // Acknowledge receipt to PayHere
    return new Response('OK', { status: 200 })
  } catch (err: any) {
    console.error('Notification API Error:', err)
    return NextResponse.json({ error: err.message || 'Callback notification processing failed' }, { status: 500 })
  }
}
