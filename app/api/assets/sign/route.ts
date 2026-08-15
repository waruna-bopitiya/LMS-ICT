import { createClient } from '@/lib/supabase/server'
import { createAdminClient, createSignedAssetUrl } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Issues a short-lived signed URL for an object in the private assets bucket.
 *
 * Authorization is derived from the storage path, which is why uploads write a
 * predictable prefix per kind of asset:
 *
 *   bank-slips/{userId}/...                  owner or admin
 *   submissions/{courseId}/{assignmentId}/{userId}/...   owner or admin
 *   admin-uploads/{courseId}/...             admin, or actively enrolled
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { path } = await request.json()

    if (!path || typeof path !== 'string') {
      return NextResponse.json({ error: 'Asset path is required' }, { status: 400 })
    }

    // Reject traversal and absolute URLs outright — this endpoint only signs
    // objects inside our own bucket.
    if (path.includes('..') || path.startsWith('/') || /^https?:/i.test(path)) {
      return NextResponse.json({ error: 'Invalid asset path' }, { status: 400 })
    }

    const admin = createAdminClient()

    const { data: profile } = await admin
      .from('users')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    const isAdmin = Boolean(profile?.is_admin)
    const allowed = await canRead(path, user.id, isAdmin, admin)

    if (!allowed) {
      return NextResponse.json({ error: 'Not allowed' }, { status: 403 })
    }

    const url = await createSignedAssetUrl(path)

    if (!url) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 })
    }

    return NextResponse.json({ url })
  } catch (error) {
    console.error('Asset signing error:', error)
    return NextResponse.json({ error: 'Failed to sign asset' }, { status: 500 })
  }
}

type AdminClient = ReturnType<typeof createAdminClient>

async function canRead(
  path: string,
  userId: string,
  isAdmin: boolean,
  admin: AdminClient
): Promise<boolean> {
  if (isAdmin) return true

  const segments = path.split('/')
  const kind = segments[0]

  if (kind === 'bank-slips') {
    return segments[1] === userId
  }

  if (kind === 'submissions') {
    return segments[3] === userId
  }

  if (kind === 'admin-uploads') {
    const courseId = segments[1]
    if (!courseId) return false

    const { data: enrollment } = await admin
      .from('enrollments')
      .select('id')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .eq('status', 'active')
      .maybeSingle()

    return Boolean(enrollment)
  }

  return false
}
