import { createClient } from '@/lib/supabase/server'
import { extractYoutubeId } from '@/lib/video'
import SecureVideoPlayer from '@/components/SecureVideoPlayer'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default async function WatchPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const { data: profile } = await supabase
    .from('users')
    .select('full_name, is_admin, password_set_at')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin && (!profile?.full_name || !profile?.password_set_at)) {
    redirect('/student/profile')
  }

  const { data: video } = await supabase
    .from('videos')
    .select('*')
    .eq('id', id)
    .single()

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

  const { data: enrollment } = await supabase
    .from('enrollments')
    .select('id')
    .eq('user_id', user.id)
    .eq('course_id', video.course_id)
    .eq('status', 'active')
    .single()

  if (!enrollment && !profile?.is_admin) {
    redirect(`/student/courses/${video.course_id}`)
  }

  const [{ data: course }, { data: allCourseVideos }, { data: progressData }] =
    await Promise.all([
      supabase.from('courses').select('id, title').eq('id', video.course_id).single(),
      supabase
        .from('videos')
        .select('id, title, course_id, sequence_order, duration_seconds')
        .eq('course_id', video.course_id)
        .order('sequence_order', { ascending: true }),
      supabase
        .from('video_progress')
        .select('watched_percentage')
        .eq('user_id', user.id)
        .eq('video_id', id)
        .single(),
    ])

  const youtubeId = extractYoutubeId(video.youtube_url)

  return (
    <div className="min-h-screen bg-background">
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
                redirect('/auth/login')
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
          Back to Course
        </Link>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card className="border-border mb-6 overflow-hidden">
              <SecureVideoPlayer
                videoId={video.id}
                title={video.title}
                youtubeId={youtubeId}
                initialProgress={progressData?.watched_percentage || 0}
              />
            </Card>

            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-foreground">{video.title}</CardTitle>
                <CardDescription>{course?.title}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Video access is limited to active students in this class.
                </p>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card className="border-border sticky top-24">
              <CardHeader>
                <CardTitle className="text-foreground">Course Videos</CardTitle>
                <CardDescription>{allCourseVideos?.length || 0} videos</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {allCourseVideos?.map((courseVideo, index) => (
                    <Link
                      key={courseVideo.id}
                      href={`/student/watch/${courseVideo.id}`}
                      className={`block p-3 rounded-md border transition ${
                        courseVideo.id === video.id
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
                            {courseVideo.title}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {courseVideo.duration_seconds
                              ? `${Math.floor(courseVideo.duration_seconds / 60)}m`
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
