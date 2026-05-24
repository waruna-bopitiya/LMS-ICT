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
    const admin = createAdminClient()

    const { data: student } = await admin
      .from('users')
      .select('id, phone_number, full_name')
      .eq('phone_number', normalizedPhone)
      .single()

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
