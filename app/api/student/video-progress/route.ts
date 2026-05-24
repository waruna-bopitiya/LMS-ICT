import { createClient } from '@/lib/supabase/server'
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

    const { videoId, percentage } = await request.json()

    if (!videoId || typeof percentage !== 'number') {
      return NextResponse.json({ error: 'Invalid progress data' }, { status: 400 })
    }

    const { data: video } = await supabase
      .from('videos')
      .select('id, course_id')
      .eq('id', videoId)
      .single()

    if (!video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 })
    }

    const { data: enrollment } = await supabase
      .from('enrollments')
      .select('id')
      .eq('user_id', user.id)
      .eq('course_id', video.course_id)
      .eq('status', 'active')
      .single()

    if (!enrollment) {
      return NextResponse.json({ error: 'Course is not active' }, { status: 403 })
    }

    const safePercentage = Math.max(0, Math.min(100, Math.round(percentage)))
    const { error } = await supabase.from('video_progress').upsert({
      user_id: user.id,
      video_id: videoId,
      watched_percentage: safePercentage,
      last_watched_at: new Date().toISOString(),
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Video progress error:', error)
    return NextResponse.json({ error: 'Failed to save progress' }, { status: 500 })
  }
}
