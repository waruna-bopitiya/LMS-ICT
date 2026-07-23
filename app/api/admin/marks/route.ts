import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
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

export async function GET(request: Request) {
  try {
    const adminUser = await checkAdmin()
    if (!adminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''

    const admin = createAdminClient()
    let query = admin.from('student_marks_with_ranks').select('*').order('created_at', { ascending: false })

    if (search) {
      if (!isNaN(Number(search))) {
        query = query.eq('student_id', Number(search))
      } else {
        query = query.or(`full_name.ilike.%${search}%,paper_name.ilike.%${search}%`)
      }
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching marks:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ marks: data })
  } catch (err: any) {
    console.error('API Error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const adminUser = await checkAdmin()
    if (!adminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { studentId, paperId, marksObtained } = body

    if (!studentId || !paperId || marksObtained === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const marksNum = Number(marksObtained)
    if (isNaN(marksNum) || marksNum < 0) {
      return NextResponse.json({ error: 'Invalid marks obtained value' }, { status: 400 })
    }

    const admin = createAdminClient()

    // 1. Fetch paper details to get the configured total_marks limit
    const { data: paper, error: paperError } = await admin
      .from('papers')
      .select('total_marks')
      .eq('id', paperId)
      .single()

    if (paperError || !paper) {
      return NextResponse.json({ error: 'Selected paper not found' }, { status: 404 })
    }

    if (marksNum > paper.total_marks) {
      return NextResponse.json({ error: `Marks obtained (${marksNum}) cannot exceed paper total marks (${paper.total_marks})` }, { status: 400 })
    }

    // 2. Look up student UUID using their student_id
    const { data: student, error: studentError } = await admin
      .from('users')
      .select('id')
      .eq('student_id', Number(studentId))
      .single()

    if (studentError || !student) {
      return NextResponse.json({ error: `Student ID ${studentId} not found` }, { status: 404 })
    }

    const percentage = (marksNum / paper.total_marks) * 100

    // 3. Upsert the marks entry
    const { data, error: upsertError } = await admin
      .from('student_marks')
      .upsert(
        {
          user_id: student.id,
          paper_id: paperId,
          marks_obtained: marksNum,
          percentage: Number(percentage.toFixed(2)),
          created_at: new Date().toISOString()
        },
        { onConflict: 'user_id,paper_id' }
      )
      .select()

    if (upsertError) {
      console.error('Error saving marks:', upsertError)
      return NextResponse.json({ error: upsertError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Marks updated successfully', data })
  } catch (err: any) {
    console.error('API Error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const adminUser = await checkAdmin()
    if (!adminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Missing record ID' }, { status: 400 })
    }

    const admin = createAdminClient()
    const { error } = await admin
      .from('student_marks')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting marks:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Record deleted successfully' })
  } catch (err: any) {
    console.error('API Error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
