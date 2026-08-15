import { createClient } from '@/lib/supabase/server'
import { uploadToSupabase, UploadValidationError } from '@/lib/supabase/admin'
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

    const { data: profile } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (!profile?.is_admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const rawCourseId = String(formData.get('courseId') || 'general')
    const rawType = String(formData.get('type') || 'material')

    if (!file) {
      return NextResponse.json({ error: 'File is required' }, { status: 400 })
    }

    // These become path segments, and the segments are what /api/assets/sign
    // reads to decide who may fetch the object. Keep them free of separators.
    const courseId = rawCourseId.replace(/[^a-zA-Z0-9_-]/g, '') || 'general'
    const type = rawType.replace(/[^a-zA-Z0-9_-]/g, '') || 'material'

    const path = await uploadToSupabase(file, `admin-uploads/${courseId}/${type}`)

    return NextResponse.json({ success: true, path })
  } catch (error) {
    if (error instanceof UploadValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    console.error('Admin upload error:', error)
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 })
  }
}
