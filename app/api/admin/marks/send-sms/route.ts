import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendFitsms } from '@/lib/sms/fitsms'
import { NextResponse } from 'next/server'

// Verify if user is admin
async function checkAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('users')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  return profile?.is_admin ? user : null
}

export async function POST(request: Request) {
  try {
    const adminUser = await checkAdmin()
    if (!adminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { recordId } = body

    if (!recordId) {
      return NextResponse.json({ error: 'Missing record ID' }, { status: 400 })
    }

    const admin = createAdminClient()

    // 1. Fetch mark details from view
    const { data: record, error: recordError } = await admin
      .from('student_marks_with_ranks')
      .select('*')
      .eq('id', recordId)
      .single()

    if (recordError || !record) {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 })
    }

    // 2. Fetch phone number from users table
    const { data: student, error: studentError } = await admin
      .from('users')
      .select('phone_number')
      .eq('id', record.user_id)
      .single()

    if (studentError || !student?.phone_number) {
      return NextResponse.json({ error: 'Student phone number not found' }, { status: 404 })
    }

    // 3. Send SMS via FitSMS
    const formattedPhone = student.phone_number.trim()
    const studentName = record.full_name || 'Student'
    const pct = Number(record.percentage).toFixed(2)
    
    const smsMessage = `Dear ${studentName}, your score for "${record.paper_name}" is ${pct}%. Check Rank & details on I SEE ICT dashboard.\niseeict.com`

    await sendFitsms({
      to: formattedPhone,
      message: smsMessage
    })

    return NextResponse.json({ success: true, message: `SMS notification sent to Student ID ${record.student_id}` })
  } catch (err: any) {
    console.error('SMS API Error:', err)
    return NextResponse.json({ error: err.message || 'Failed to send SMS' }, { status: 500 })
  }
}
