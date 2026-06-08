import { normalizePhoneNumber } from '@/lib/auth/phone'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { phone } = await request.json()

    if (!phone) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 })
    }

    const cleanDigits = phone.replace(/\D/g, '')
    if (cleanDigits.length < 9) {
      return NextResponse.json({ error: 'Phone number must have at least 9 digits' }, { status: 400 })
    }

    const last9 = cleanDigits.slice(-9)
    const admin = createAdminClient()

    // Match database phone number using the last 9 digits
    const { data: profile } = await admin
      .from('users')
      .select('id, phone_number, full_name, profile_completed_at, password_set_at')
      .like('phone_number', `%${last9}`)
      .limit(1)
      .maybeSingle()

    if (profile) {
      return NextResponse.json({
        phone: profile.phone_number,
        canLoginWithPassword: Boolean(profile.profile_completed_at && profile.password_set_at),
      })
    }

    // Default normalization for new signups
    const normalizedPhone = normalizePhoneNumber(phone)
    return NextResponse.json({
      phone: normalizedPhone,
      canLoginWithPassword: false,
    })
  } catch (error) {
    console.error('Check phone error:', error)
    return NextResponse.json({ error: 'Failed to check phone number' }, { status: 500 })
  }
}
