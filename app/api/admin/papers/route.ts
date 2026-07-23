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

export async function GET() {
  try {
    const adminUser = await checkAdmin()
    if (!adminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admin = createAdminClient()
    const { data, error } = await admin
      .from('papers')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching papers:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ papers: data })
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
    const { name, totalMarks } = body

    if (!name || !totalMarks) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const totalNum = Number(totalMarks)
    if (isNaN(totalNum) || totalNum <= 0) {
      return NextResponse.json({ error: 'Invalid total marks' }, { status: 400 })
    }

    const admin = createAdminClient()
    const { data, error } = await admin
      .from('papers')
      .insert({
        name: name.trim(),
        total_marks: totalNum
      })
      .select()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'A paper with this name already exists' }, { status: 400 })
      }
      console.error('Error creating paper:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Paper created successfully', data: data[0] })
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
      return NextResponse.json({ error: 'Missing paper ID' }, { status: 400 })
    }

    const admin = createAdminClient()
    const { error } = await admin
      .from('papers')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting paper:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Paper deleted successfully' })
  } catch (err: any) {
    console.error('API Error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
