import { createClient } from '@/lib/supabase/server'
import { extractYoutubeId } from '@/lib/video'
import SecureVideoPlayer from '@/components/SecureVideoPlayer'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Navbar from '@/components/Navbar'
import { ChevronLeft, Play, Film, Info } from 'lucide-react'
import { parseVideoTitle } from '@/lib/utils'

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
    .select('full_name, is_admin, phone_number, password_set_at, student_id')
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
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center max-w-sm glass-panel p-8 rounded-2xl border-border">
          <Info className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Video Not Found</h1>
          <p className="text-muted-foreground text-sm mb-6">This video could not be loaded or has been deleted.</p>
          <Link href="/student/dashboard">
            <Button className="w-full bg-primary hover:bg-primary/95 text-primary-foreground font-semibold rounded-xl">
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  const { title: cleanTitle, thumbnailUrl } = parseVideoTitle(video.title)

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
    <div className="min-h-screen bg-background relative overflow-hidden">
      
      {/* Background patterns */}
      <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none" />
      <div className="absolute top-0 right-0 -z-10 h-[300px] w-[300px] rounded-full bg-primary/5 blur-[80px] pointer-events-none" />

      {/* Navigation */}
      <Navbar user={user} isAdmin={false} fullName={profile?.full_name || ''} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative z-10">
        
        {/* Back Link */}
        <Link
          href={`/student/courses/${video.course_id}`}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-primary transition-colors mb-6"
        >
          <ChevronLeft className="h-4 w-4" /> Back to Course Syllabus
        </Link>

        <div className="grid lg:grid-cols-3 gap-8 items-start">
          
          {/* Video Player */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-border glass-panel rounded-2xl overflow-hidden shadow-sm">
              <CardContent className="p-0">
                <SecureVideoPlayer
                  videoId={video.id}
                  title={cleanTitle}
                  youtubeId={youtubeId}
                  initialProgress={progressData?.watched_percentage || 0}
                  watermark={`${profile?.phone_number || ''} ${profile?.student_id ? `(ID: ${profile.student_id})` : ''}`}
                />
              </CardContent>
            </Card>

            <Card className="border-border glass-panel rounded-2xl shadow-sm">
              <CardHeader className="p-6">
                <span className="text-primary text-xs font-bold uppercase tracking-widest bg-primary/10 border border-primary/20 px-3 py-0.5 rounded-full inline-block mb-3">
                  NOW PLAYING
                </span>
                <CardTitle className="text-2xl font-bold text-foreground">{cleanTitle}</CardTitle>
                <CardDescription className="text-sm font-semibold text-muted-foreground mt-1">
                  Course: {course?.title}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 pt-0 border-t border-border/40">
                <div className="flex items-start gap-2.5 mt-4 text-xs text-muted-foreground bg-secondary/35 p-3.5 rounded-xl border border-border/30">
                  <Info className="h-4.5 w-4.5 text-primary shrink-0" />
                  <p className="leading-relaxed">
                    Lesson streams are secured. Account sharing or video downloading is strictly prohibited. If you face any buffering, please check your network connection.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Playlist Panel */}
          <div>
            <Card className="border-border glass-panel sticky top-24 rounded-2xl overflow-hidden shadow-sm">
              <CardHeader className="p-6 border-b border-border/40">
                <CardTitle className="text-lg font-bold text-foreground">Course Playlists</CardTitle>
                <CardDescription className="text-xs font-semibold text-muted-foreground mt-1 uppercase tracking-wider">
                  {allCourseVideos?.length || 0} Lecture Sessions
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-3">
                <div className="space-y-2">
                  {allCourseVideos?.map((courseVideo, index) => {
                    const isActive = courseVideo.id === video.id
                    const { title: playTitle, thumbnailUrl: playThumb } = parseVideoTitle(courseVideo.title)
                    return (
                      <Link
                        key={courseVideo.id}
                        href={`/student/watch/${courseVideo.id}`}
                        className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all duration-200 cursor-pointer ${
                          isActive
                            ? 'bg-primary/10 border-primary text-foreground shadow-sm'
                            : 'bg-secondary/10 border-border/40 hover:bg-secondary/35 hover:border-border text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {playThumb ? (
                          <div className="flex-shrink-0 w-12 h-8 rounded overflow-hidden border border-border/40">
                            <img src={playThumb} alt={playTitle} className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                            isActive ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'
                          }`}>
                            {index + 1}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold truncate leading-tight">
                            {playTitle}
                          </p>
                          <p className="text-[11px] text-muted-foreground mt-1 font-medium flex items-center gap-1">
                            <Film className="h-3 w-3" />
                            {courseVideo.duration_seconds
                              ? `${Math.floor(courseVideo.duration_seconds / 60)} minutes`
                              : 'Session duration'}
                          </p>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

        </div>
      </div>
    </div>
  )
}

