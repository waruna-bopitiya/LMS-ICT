import { normalizePhoneNumber } from '@/lib/auth/phone'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
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

    const { data: adminProfile } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (!adminProfile?.is_admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { phone, courseId } = await request.json()

    if (!phone || !courseId) {
      return NextResponse.json(
        { error: 'Phone number and class are required' },
        { status: 400 }
      )
    }

    const normalizedPhone = normalizePhoneNumber(phone)

    if (!normalizedPhone) {
      return NextResponse.json(
        { error: 'Enter a valid Sri Lankan mobile number, for example 0771234567' },
        { status: 400 }
      )
    }

    const admin = createAdminClient()

    const { data: student } = await admin
      .from('users')
      .select('id, phone_number, full_name')
      .eq('phone_number', normalizedPhone)
      .maybeSingle()

    if (!student) {
      return NextResponse.json(
        { error: 'Student not found. Ask the student to register with OTP first.' },
        { status: 404 }
      )
    }

    const { data: course } = await admin
      .from('courses')
      .select('id, price')
      .eq('id', courseId)
      .single()

    if (!course) {
      return NextResponse.json({ error: 'Class not found' }, { status: 404 })
    }

    const { data: payment, error: paymentError } = await admin
      .from('payments')
      .insert({
        user_id: student.id,
        course_id: course.id,
        bank_slip_url: 'manual-admin-activation',
        amount: course.price,
        status: 'approved',
        approved_by: user.id,
      })
      .select()
      .single()

    if (paymentError) {
      return NextResponse.json({ error: paymentError.message }, { status: 500 })
    }

    const { error: enrollmentError } = await admin.from('enrollments').upsert(
      {
        user_id: student.id,
        course_id: course.id,
        payment_id: payment.id,
        status: 'active',
      },
      { onConflict: 'user_id,course_id' }
    )

    if (enrollmentError) {
      return NextResponse.json({ error: enrollmentError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Student activated for this class',
      student,
    })
  } catch (error) {
    console.error('Manual enrollment error:', error)
    return NextResponse.json(
      { error: 'Failed to activate student' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { data: adminProfile } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (!adminProfile?.is_admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const enrollmentId = searchParams.get('id')

    if (!enrollmentId) {
      return NextResponse.json({ error: 'Enrollment ID is required' }, { status: 400 })
    }

    const admin = createAdminClient()
    
    // First, find the enrollment to get the payment_id (if we also want to clean up or update the payment)
    const { data: enrollment, error: fetchError } = await admin
      .from('enrollments')
      .select('payment_id')
      .eq('id', enrollmentId)
      .single()

    if (fetchError || !enrollment) {
      return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 })
    }

    // Delete the enrollment
    const { error: deleteError } = await admin
      .from('enrollments')
      .delete()
      .eq('id', enrollmentId)

    if (deleteError) {
      console.error('Error deleting enrollment:', deleteError)
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    // If there was an associated payment, mark it as rejected/cancelled so it doesn't show up as pending anymore
    if (enrollment.payment_id) {
      await admin
        .from('payments')
        .update({ status: 'rejected' })
        .eq('id', enrollment.payment_id)
    }

    return NextResponse.json({
      success: true,
      message: 'Enrollment revoked and class access removed.',
    })
  } catch (error) {
    console.error('Revoke enrollment error:', error)
    return NextResponse.json(
      { error: 'Failed to revoke enrollment' },
      { status: 500 }
    )
  }
}
