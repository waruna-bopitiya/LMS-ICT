import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Reports where a payment attempt stands, for the confirmation screen to poll.
 *
 * PayHere's notify callback is server-to-server and lands independently of the
 * browser redirect, so the student can arrive back before the enrollment is
 * activated. Polling this is what turns that race into a visible "processing"
 * state instead of a dashboard that silently shows nothing.
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const paymentId = new URL(request.url).searchParams.get('payment')

    if (!paymentId) {
      return NextResponse.json({ error: 'Payment reference is required' }, { status: 400 })
    }

    const admin = createAdminClient()

    const { data: payment } = await admin
      .from('payments')
      .select('id, user_id, course_id, status, amount, bank_slip_url, courses(title)')
      .eq('id', paymentId)
      .maybeSingle()

    // Scoped to the caller: a payment id is a UUID, but it is also passed
    // through a URL the student can edit.
    if (!payment || payment.user_id !== user.id) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    }

    const { data: enrollment } = await admin
      .from('enrollments')
      .select('status')
      .eq('user_id', user.id)
      .eq('course_id', payment.course_id)
      .maybeSingle()

    const isBankTransfer =
      Boolean(payment.bank_slip_url) && !payment.bank_slip_url?.startsWith('PayHere Ref:')

    return NextResponse.json({
      paymentStatus: payment.status,
      enrollmentStatus: enrollment?.status ?? null,
      courseId: payment.course_id,
      courseTitle: (payment.courses as { title?: string } | null)?.title ?? 'your class',
      amount: Number(payment.amount),
      isBankTransfer,
    })
  } catch (error) {
    console.error('Payment status error:', error)
    return NextResponse.json({ error: 'Failed to check payment status' }, { status: 500 })
  }
}
