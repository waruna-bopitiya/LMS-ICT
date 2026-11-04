import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

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

// Publish or unpublish a class.
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await checkAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const { is_published } = await request.json()

  if (typeof is_published !== 'boolean') {
    return NextResponse.json({ error: 'is_published must be true or false' }, { status: 400 })
  }

  const { error } = await createAdminClient()
    .from('courses')
    .update({ is_published })
    .eq('id', id)

  if (error) {
    console.error('Course publish error:', error.message)
    return NextResponse.json({ error: 'Failed to update class' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

// Delete a class. Every child table cascades, so a class that students have
// enrolled in or paid for is refused: deleting it would silently erase their
// payment and enrolment records. Unpublish those instead.
export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await checkAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const admin = createAdminClient()

  const [{ count: enrollments }, { count: payments }] = await Promise.all([
    admin.from('enrollments').select('id', { count: 'exact', head: true }).eq('course_id', id),
    admin.from('payments').select('id', { count: 'exact', head: true }).eq('course_id', id),
  ])

  if ((enrollments ?? 0) > 0 || (payments ?? 0) > 0) {
    return NextResponse.json(
      { error: 'This class has enrolments or payments. Unpublish it instead of deleting.' },
      { status: 409 }
    )
  }

  const { error } = await admin.from('courses').delete().eq('id', id)

  if (error) {
    console.error('Course delete error:', error.message)
    return NextResponse.json({ error: 'Failed to delete class' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
