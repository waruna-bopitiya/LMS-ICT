import { normalizePhoneNumber } from '@/lib/auth/phone'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { phone } = await request.json()

    if (!phone) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 })
    }

    const normalizedPhone = normalizePhoneNumber(phone)
    const admin = createAdminClient()

    const { data: profile } = await admin
      .from('users')
      .select('id, full_name, profile_completed_at, password_set_at')
      .eq('phone_number', normalizedPhone)
      .single()

    return NextResponse.json({
      phone: normalizedPhone,
      canLoginWithPassword: Boolean(profile?.profile_completed_at && profile?.password_set_at),
    })
  } catch (error) {
    console.error('Check phone error:', error)
    return NextResponse.json({ error: 'Failed to check phone number' }, { status: 500 })
  }
}
