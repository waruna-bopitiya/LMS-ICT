import { createClient } from '@/lib/supabase/server'
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

    // Check if user is admin
    const { data: userProfile } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (!userProfile?.is_admin) {
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required' },
        { status: 403 }
      )
    }

    const { paymentId } = await request.json()

    if (!paymentId) {
      return NextResponse.json(
        { error: 'Payment ID is required' },
        { status: 400 }
      )
    }

    // Update payment status
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .update({
        status: 'rejected',
        approved_by: user.id,
      })
      .eq('id', paymentId)
      .select()
      .single()

    if (paymentError) {
      return NextResponse.json(
        { error: 'Failed to reject payment' },
        { status: 500 }
      )
    }

    // Delete associated enrollment
    const { error: enrollmentError } = await supabase
      .from('enrollments')
      .delete()
      .eq('payment_id', paymentId)

    if (enrollmentError) {
      console.error('Error deleting enrollment:', enrollmentError)
    }

    return NextResponse.json({
      success: true,
      message: 'Payment rejected',
      payment,
    })
  } catch (error) {
    console.error('Reject payment error:', error)
    return NextResponse.json(
      { error: 'Failed to reject payment' },
      { status: 500 }
    )
  }
}
