import { createAdminClient } from '@/lib/supabase/admin'

export type EnrollmentAttempt =
  | { ok: true; paymentId: string; coursePrice: number; courseTitle: string }
  | { ok: false; status: number; error: string }

/**
 * Opens a payment attempt for a course and points the student's enrollment at
 * it.
 *
 * This runs with the service role rather than the caller's client for two
 * reasons. The RLS insert policies pin `amount` to the course price and
 * `status` to 'pending' — good against a hostile client, but PostgREST upserts
 * take the UPDATE path on conflict, and enrollment UPDATE is admin-only, so a
 * student retrying a payment hit a policy denial. And the enrollment's
 * payment_id has to be re-pointed at the new attempt: both the PayHere callback
 * and admin approval activate by `payment_id`, so a stale link means an
 * approved payment never unlocks the course.
 *
 * The amount is still read from `courses` here, never from the request, so the
 * trust boundary is unchanged.
 */
export async function startEnrollmentAttempt(
  userId: string,
  courseId: string,
  bankSlipPath: string | null
): Promise<EnrollmentAttempt> {
  const admin = createAdminClient()

  const { data: course } = await admin
    .from('courses')
    .select('id, title, price')
    .eq('id', courseId)
    .maybeSingle()

  if (!course) {
    return { ok: false, status: 404, error: 'Selected class was not found' }
  }

  const { data: existing } = await admin
    .from('enrollments')
    .select('id, status')
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .maybeSingle()

  if (existing?.status === 'active') {
    return {
      ok: false,
      status: 409,
      error: 'You already have access to this class.',
    }
  }

  // Retire any earlier unfinished attempt at this course. Without this, an
  // abandoned checkout leaves a pending payment behind and the student's
  // "Pending Slips" count climbs with every retry.
  await admin
    .from('payments')
    .update({ status: 'rejected' })
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .eq('status', 'pending')

  const { data: payment, error: paymentError } = await admin
    .from('payments')
    .insert({
      user_id: userId,
      course_id: course.id,
      amount: course.price,
      status: 'pending',
      bank_slip_url: bankSlipPath,
    })
    .select('id')
    .single()

  if (paymentError || !payment) {
    console.error('Failed to create payment record:', paymentError?.message)
    return { ok: false, status: 500, error: 'Failed to start the payment' }
  }

  const { error: enrollmentError } = await admin
    .from('enrollments')
    .upsert(
      {
        user_id: userId,
        course_id: course.id,
        payment_id: payment.id,
        status: 'pending',
      },
      { onConflict: 'user_id,course_id' }
    )

  if (enrollmentError) {
    console.error('Failed to link enrollment:', enrollmentError.message)
    return { ok: false, status: 500, error: 'Failed to start the enrollment' }
  }

  return {
    ok: true,
    paymentId: payment.id,
    coursePrice: Number(course.price),
    courseTitle: course.title,
  }
}
