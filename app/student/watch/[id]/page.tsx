'use client'

import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface Video {
  id: string
  title: string
  youtube_url: string
  course_id: string
  sequence_order: number
}

interface Course {
  id: string
  title: string
}

export default function WatchPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const [videoId, setVideoId] = useState<string>('')
  const [video, setVideo] = useState<Video | null>(null)
  const [course, setCourse] = useState<Course | null>(null)
  const [progress, setProgress] = useState(0)
  const [loading, setLoading] = useState(true)
  const [allCourseVideos, setAllCourseVideos] = useState<Video[]>([])
  const router = useRouter()
  const supabase = createClient()
  const lastUpdateRef = useRef<number>(0)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { id } = await params
        setVideoId(id)

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/auth/login')
          return
        }

        // Get video details
        const { data: videoData, error: videoError } = await supabase
          .from('videos')
          .select('*')
          .eq('id', id)
          .single()

        if (videoError || !videoData) {
          router.push('/student/dashboard')
          return
        }

        setVideo(videoData)

        // Get course details
        const { data: courseData } = await supabase
          .from('courses')
          .select('*')
          .eq('id', videoData.course_id)
          .single()

        setCourse(courseData)

        // Check if user is enrolled
        const { data: enrollment } = await supabase
          .from('enrollments')
          .select('*')
          .eq('user_id', user.id)
          .eq('course_id', videoData.course_id)
          .eq('status', 'active')
          .single()

        if (!enrollment) {
          router.push(`/student/courses/${videoData.course_id}`)
          return
        }

        // Get all videos for this course
        const { data: videosData } = await supabase
          .from('videos')
          .select('*')
          .eq('course_id', videoData.course_id)
          .order('sequence_order', { ascending: true })

        setAllCourseVideos(videosData || [])

        // Get current progress
        const { data: progressData } = await supabase
          .from('video_progress')
          .select('*')
          .eq('user_id', user.id)
          .eq('video_id', id)
          .single()

        if (progressData) {
          setProgress(progressData.watched_percentage || 0)
        }
      } catch (error) {
        console.error('Error fetching video:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [params, supabase, router])

  const updateProgress = async (percentage: number) => {
    if (!video) return

    const now = Date.now()
    if (now - lastUpdateRef.current < 5000) return
    lastUpdateRef.current = now

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from('video_progress')
        .upsert({
          user_id: user.id,
          video_id: video.id,
          watched_percentage: percentage,
          last_watched_at: new Date().toISOString(),
        })

      if (error) console.error('Error updating progress:', error)
    } catch (error) {
      console.error('Error updating progress:', error)
    }
  }

  const handleVideoProgress = (e: any) => {
    const video = e.target
    const percentage = Math.round((video.currentTime / video.duration) * 100)
    setProgress(percentage)
    updateProgress(percentage)
  }

  const extractYoutubeId = (url: string) => {
    const regex = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/
    const match = url.match(regex)
    return match ? match[1] : ''
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading video...</p>
      </div>
    )
  }

  if (!video) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground mb-4">Video Not Found</h1>
          <Link href="/student/dashboard">
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  const youtubeId = extractYoutubeId(video.youtube_url)

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="bg-secondary/5 border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <Link href="/" className="text-2xl font-bold text-primary">
            LMS
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/student/dashboard" className="text-foreground hover:text-primary transition">
              Dashboard
            </Link>
            <form
              action={async () => {
                'use server'
                const client = await createClient()
                await client.auth.signOut()
              }}
              method="POST"
            >
              <button
                type="submit"
                className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90 transition"
              >
                Sign Out
              </button>
            </form>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link href={`/student/courses/${video.course_id}`} className="text-primary hover:text-primary/80 transition mb-8 inline-block">
          ← Back to Course
        </Link>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Video */}
          <div className="lg:col-span-2">
            <Card className="border-border mb-6 overflow-hidden">
              <div className="aspect-video bg-secondary/20 relative">
                <iframe
                  width="100%"
                  height="100%"
                  src={`https://www.youtube.com/embed/${youtubeId}?enablejsapi=1`}
                  title={video.title}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  onTimeUpdate={handleVideoProgress}
                  className="w-full h-full"
                />
              </div>
            </Card>

            {/* Video Info */}
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-foreground">{video.title}</CardTitle>
                <CardDescription>{course?.title}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Progress Bar */}
                <div>
                  <div className="flex justify-between text-sm text-muted-foreground mb-2">
                    <span>Progress</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="w-full bg-secondary/30 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                {progress >= 80 && (
                  <div className="p-3 rounded-md bg-green-500/10 border border-green-500/20">
                    <p className="text-sm text-green-600 dark:text-green-400 font-semibold">
                      Great! You&apos;ve watched most of this video.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Course Videos Sidebar */}
          <div>
            <Card className="border-border sticky top-24">
              <CardHeader>
                <CardTitle className="text-foreground">Course Videos</CardTitle>
                <CardDescription>{allCourseVideos.length} videos</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {allCourseVideos.map((v, index) => (
                    <Link
                      key={v.id}
                      href={`/student/watch/${v.id}`}
                      className={`block p-3 rounded-md border transition ${
                        v.id === video.id
                          ? 'bg-primary/20 border-primary'
                          : 'bg-secondary/10 border-border hover:bg-secondary/20'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-8 h-8 bg-primary/30 rounded-full flex items-center justify-center">
                          <span className="text-xs font-bold text-primary">{index + 1}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">
                            {v.title}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {v.duration_seconds
                              ? `${Math.floor(v.duration_seconds / 60)}m`
                              : 'Duration'}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
