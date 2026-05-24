import { createClient } from '@/lib/supabase/server'
import { extractYoutubeId } from '@/lib/video'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { data: video } = await supabase
      .from('videos')
      .select('id, course_id, youtube_url')
      .eq('id', id)
      .single()

    if (!video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 })
    }

    const { data: profile } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    const { data: enrollment } = await supabase
      .from('enrollments')
      .select('id')
      .eq('user_id', user.id)
      .eq('course_id', video.course_id)
      .eq('status', 'active')
      .single()

    if (!enrollment && !profile?.is_admin) {
      return NextResponse.json({ error: 'Course is not active' }, { status: 403 })
    }

    if (extractYoutubeId(video.youtube_url)) {
      return NextResponse.json(
        { error: 'YouTube videos cannot be proxied securely' },
        { status: 400 }
      )
    }

    const range = request.headers.get('range')
    const upstream = await fetch(video.youtube_url, {
      headers: range ? { Range: range } : undefined,
    })

    if (!upstream.ok && upstream.status !== 206) {
      return NextResponse.json({ error: 'Video source unavailable' }, { status: 502 })
    }

    const headers = new Headers()
    const passthroughHeaders = [
      'content-type',
      'content-length',
      'content-range',
      'accept-ranges',
    ]

    passthroughHeaders.forEach(header => {
      const value = upstream.headers.get(header)
      if (value) headers.set(header, value)
    })

    headers.set('Cache-Control', 'private, no-store, max-age=0')
    headers.set('X-Content-Type-Options', 'nosniff')
    headers.set('Content-Disposition', 'inline')
    headers.set('Access-Control-Allow-Credentials', 'true')

    return new NextResponse(upstream.body, {
      status: upstream.status,
      headers,
    })
  } catch (error) {
    console.error('Video stream error:', error)
    return NextResponse.json({ error: 'Failed to stream video' }, { status: 500 })
  }
}
