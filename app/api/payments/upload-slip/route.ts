import { createClient } from '@/lib/supabase/server'
import { uploadToSupabase } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const courseId = formData.get('courseId') as string
    const amount = formData.get('amount') as string

    if (!file || !courseId || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Upload to Supabase Storage
    const filename = `bank-slips/${user.id}/${courseId}/${Date.now()}-${file.name}`
    const publicUrl = await uploadToSupabase(file, filename)

    // Create payment record in database
    const { data: paymentData, error: paymentError } = await supabase
      .from('payments')
      .insert({
        user_id: user.id,
        course_id: courseId,
        bank_slip_url: publicUrl,
        amount: parseFloat(amount),
        status: 'pending',
      })

      .select()
      .single()

    if (paymentError) {
      return NextResponse.json(
        { error: 'Failed to save payment record' },
        { status: 500 }
      )
    }

    // Create enrollment record (initially pending)
    const { error: enrollmentError } = await supabase
      .from('enrollments')
      .insert({
        user_id: user.id,
        course_id: courseId,
        payment_id: paymentData.id,
        status: 'pending',
      })

    if (enrollmentError && !enrollmentError.message.includes('duplicate')) {
      return NextResponse.json(
        { error: 'Failed to create enrollment' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Bank slip uploaded successfully',
      payment: paymentData,
    })
  } catch (error) {
    console.error('Bank slip upload error:', error)
    return NextResponse.json(
      { error: 'Failed to upload bank slip' },
      { status: 500 }
    )
  }
}
