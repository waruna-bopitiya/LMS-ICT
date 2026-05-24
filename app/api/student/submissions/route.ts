import { createClient } from '@/lib/supabase/server'
import { put } from '@vercel/blob'
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

    const formData = await request.formData()
    const assignmentId = String(formData.get('assignmentId') || '')
    const answerText = String(formData.get('answerText') || '').trim()
    const file = formData.get('file') as File | null

    if (!assignmentId || (!answerText && !file)) {
      return NextResponse.json(
        { error: 'Submission answer or file is required' },
        { status: 400 }
      )
    }

    const { data: assignment } = await supabase
      .from('assignments')
      .select('id, course_id')
      .eq('id', assignmentId)
      .single()

    if (!assignment) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
    }

    const { data: enrollment } = await supabase
      .from('enrollments')
      .select('id')
      .eq('user_id', user.id)
      .eq('course_id', assignment.course_id)
      .eq('status', 'active')
      .single()

    if (!enrollment) {
      return NextResponse.json({ error: 'Course is not active' }, { status: 403 })
    }

    let fileUrl: string | null = null
    if (file && file.size > 0) {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-')
      const filename = `submissions/${assignment.course_id}/${assignmentId}/${user.id}/${Date.now()}-${safeName}`
      const blob = await put(filename, file, {
        access: 'public',
      })
      fileUrl = blob.url
    }

    const { error } = await supabase.from('assignment_submissions').upsert(
      {
        assignment_id: assignmentId,
        user_id: user.id,
        answer_text: answerText || null,
        file_url: fileUrl,
        submitted_at: new Date().toISOString(),
      },
      { onConflict: 'assignment_id,user_id' }
    )

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Student submission error:', error)
    return NextResponse.json({ error: 'Failed to submit' }, { status: 500 })
  }
}
