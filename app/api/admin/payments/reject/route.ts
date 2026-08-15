import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
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

    // Deleted through the service role. The previous anon-key delete matched no
    // rows under RLS and only logged the failure, so rejected payments left
    // their enrollment row behind.
    const { error: enrollmentError } = await createAdminClient()
      .from('enrollments')
      .delete()
      .eq('payment_id', paymentId)

    if (enrollmentError) {
      console.error('Error deleting enrollment:', enrollmentError.message)
      return NextResponse.json(
        { error: 'Payment rejected but enrollment could not be removed' },
        { status: 500 }
      )
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
