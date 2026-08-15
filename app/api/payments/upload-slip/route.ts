import { createClient } from '@/lib/supabase/server'
import { uploadToSupabase, UploadValidationError } from '@/lib/supabase/admin'
import { startEnrollmentAttempt } from '@/lib/enrollment'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const rawCourseId = String(formData.get('courseId') || '')

    if (!file || !rawCourseId) {
      return NextResponse.json(
        { error: 'Bank slip and class are required' },
        { status: 400 }
      )
    }

    const courseId = rawCourseId.replace(/[^a-zA-Z0-9-]/g, '')

    // Upload first: if the file is rejected there is no half-made payment row.
    const path = await uploadToSupabase(
      file,
      `bank-slips/${user.id}/${courseId}`,
      'any-attachment'
    )

    // The amount is read from the course inside this helper, never from the
    // request. It also re-points the enrollment at this new payment, so a slip
    // uploaded after an abandoned online checkout still activates on approval.
    const attempt = await startEnrollmentAttempt(user.id, courseId, path)

    if (!attempt.ok) {
      return NextResponse.json({ error: attempt.error }, { status: attempt.status })
    }

    return NextResponse.json({
      success: true,
      message: 'Bank slip uploaded successfully',
      paymentId: attempt.paymentId,
    })
  } catch (error) {
    if (error instanceof UploadValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    console.error('Bank slip upload error:', error)
    return NextResponse.json(
      { error: 'Failed to upload bank slip' },
      { status: 500 }
    )
  }
}
