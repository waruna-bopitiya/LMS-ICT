import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
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
    const phone = searchParams.get('phone')

    if (!phone) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      )
    }

    const cleanDigits = phone.replace(/\D/g, '')
    if (cleanDigits.length < 9) {
      return NextResponse.json(
        { error: 'Phone number must have at least 9 digits' },
        { status: 400 }
      )
    }

    const last9 = cleanDigits.slice(-9)
    const admin = createAdminClient()

    // Query for student with matching last 9 digits of phone
    const { data: students, error } = await admin
      .from('users')
      .select('id, phone_number, full_name, school, district, guardian_phone, is_admin, student_id')
      .like('phone_number', `%${last9}`)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      students: students || [],
    })
  } catch (error) {
    console.error('Get student error:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve student details' },
      { status: 500 }
    )
  }
}
