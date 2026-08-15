import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import crypto from 'crypto'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // 1. Get authenticated user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized: Authentication required' }, { status: 401 })
    }

    const body = await request.json()
    const { courseId } = body

    if (!courseId) {
      return NextResponse.json({ error: 'Missing course ID' }, { status: 400 })
    }

    // 2. Fetch course details
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('*')
      .eq('id', courseId)
      .single()

    if (courseError || !course) {
      return NextResponse.json({ error: 'Selected class module not found' }, { status: 404 })
    }

    // 3. Fetch user profile
    const { data: profile } = await supabase
      .from('users')
      .select('full_name, phone_number')
      .eq('id', user.id)
      .single()

    const amount = Number(course.price)
    const formattedAmount = amount.toFixed(2)

    // 4. Create a pending payment record
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        user_id: user.id,
        course_id: courseId,
        amount,
        status: 'pending'
      })
      .select()
      .single()

    if (paymentError || !payment) {
      console.error('Error creating pending payment:', paymentError)
      return NextResponse.json({ error: 'Failed to initialize payment' }, { status: 500 })
    }

    // 5. Upsert corresponding enrollment record
    const { error: enrollmentError } = await supabase
      .from('enrollments')
      .upsert({
        user_id: user.id,
        course_id: courseId,
        payment_id: payment.id,
        status: 'pending'
      }, { onConflict: 'user_id,course_id' })

    if (enrollmentError) {
      console.error('Error upserting pending enrollment:', enrollmentError)
      return NextResponse.json({ error: 'Failed to initialize enrollment' }, { status: 500 })
    }

    // 6. PayHere configurations
    const merchantId = process.env.NEXT_PUBLIC_PAYHERE_MERCHANT_ID
    const merchantSecret = process.env.PAYHERE_MERCHANT_SECRET
    const isSandbox = process.env.NEXT_PUBLIC_PAYHERE_IS_SANDBOX === 'true'
    const currency = 'LKR'

    if (!merchantId || !merchantSecret) {
      console.error('PayHere configuration missing in server environment')
      return NextResponse.json({ error: 'Payment gateway configuration error' }, { status: 500 })
    }

    // Calculate MD5 hash: uppercase(md5(merchant_id + order_id + formatted_amount + currency + uppercase(md5(merchant_secret))))
    const hashedSecret = crypto.createHash('md5').update(merchantSecret).digest('hex').toUpperCase()
    const hashString = merchantId + payment.id + formattedAmount + currency + hashedSecret
    const finalHash = crypto.createHash('md5').update(hashString).digest('hex').toUpperCase()

    // 7. Format customer name
    const names = (profile?.full_name || 'Student User').trim().split(/\s+/)
    const firstName = names[0] || 'Student'
    const lastName = names.slice(1).join(' ') || 'User'

    return NextResponse.json({
      success: true,
      sandbox: isSandbox,
      merchantId,
      orderId: payment.id,
      amount: formattedAmount,
      currency,
      hash: finalHash,
      items: course.title,
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
  } catch (err: any) {
    console.error('Checkout API error:', err)
    return NextResponse.json({ error: err.message || 'An error occurred during checkout' }, { status: 500 })
  }
}
