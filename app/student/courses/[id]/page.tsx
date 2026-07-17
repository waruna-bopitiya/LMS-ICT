import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { redirect } from 'next/navigation'
import EnrollmentForm from '@/components/EnrollmentForm'
import { requireCompletedProfile } from '@/lib/auth/profile'
import StudentSubmissionForm from '@/components/StudentSubmissionForm'
import Navbar from '@/components/Navbar'
import { ChevronLeft, Play, FileText, Calendar, CheckCircle, Clock, BadgeCheck, AlertCircle } from 'lucide-react'
import { parseCourseDescription, parseVideoTitle } from '@/lib/utils'
import SecurePdfViewer from '@/components/SecurePdfViewer'

export default async function CoursePage({
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

  const userProfile = await requireCompletedProfile(supabase, user.id)
  const fullName = userProfile?.full_name || ''

  // Get course details
  const { data: course, error: courseError } = await supabase
    .from('courses')
    .select('*')
    .eq('id', id)
    .single()

  if (courseError || !course) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center max-w-sm glass-panel p-8 rounded-2xl border-border">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Course Not Found</h1>
          <p className="text-muted-foreground text-sm mb-6">This course syllabus may have been moved or archived.</p>
          <Link href="/">
            <Button className="w-full bg-primary hover:bg-primary/95 text-primary-foreground font-semibold rounded-xl">
              Back to Courses
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  const { description: cleanDescription, imageUrl } = parseCourseDescription(course.description)

  // Check if user is enrolled
  const { data: enrollment } = await supabase
    .from('enrollments')
    .select('*')
    .eq('user_id', user.id)
    .eq('course_id', id)
    .single()

  // Get videos for this course
  const { data: videos } = await supabase
    .from('videos')
    .select('*')
    .eq('course_id', id)
    .order('sequence_order', { ascending: true })

  const { data: materials } = await supabase
    .from('course_materials')
    .select('*')
    .eq('course_id', id)
    .order('sequence_order', { ascending: true })

  const { data: assignments } = await supabase
    .from('assignments')
    .select('*, assignment_submissions(id, user_id, answer_text, file_url, submitted_at)')
    .eq('course_id', id)
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      
      {/* Background patterns */}
      <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none" />
      <div className="absolute top-0 right-0 -z-10 h-[300px] w-[300px] rounded-full bg-primary/5 blur-[80px] pointer-events-none" />

      {/* Navigation */}
      <Navbar user={user} isAdmin={false} fullName={fullName} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative z-10">
        
        {/* Back navigation */}
        <Link
          href="/student/dashboard"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-primary transition-colors mb-6"
        >
          <ChevronLeft className="h-4 w-4" /> Back to Dashboard
        </Link>

        <div className="grid lg:grid-cols-3 gap-8 items-start">
          
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Header info */}
            <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-indigo-950/20 via-slate-900/10 to-background border border-border/50 shadow-sm relative overflow-hidden">
              <div className="absolute inset-0 bg-grid-pattern opacity-5 pointer-events-none" />
              <div className="relative">
                <span className="text-primary text-xs font-bold uppercase tracking-widest bg-primary/10 border border-primary/20 px-3 py-0.5 rounded-full inline-block mb-4">
                  COURSE SYLLABUS
                </span>
                <h1 className="text-3xl sm:text-4xl font-bold text-foreground leading-tight">
                  {course.title}
                </h1>
                <p className="text-muted-foreground text-sm sm:text-base mt-3 leading-relaxed">
                  {cleanDescription || 'Access pre-recorded lectures, tutorials, notes, and submit assignments for evaluation.'}
                </p>
              </div>
            </div>

            {/* Locked Content Warning if not active */}
            {(!enrollment || enrollment.status !== 'active') && (
              <div className="p-6 rounded-2xl bg-secondary/35 border border-border/50 text-center max-w-xl mx-auto">
                <AlertCircle className="h-10 w-10 text-muted-foreground/60 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-foreground mb-1">Content Locked</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {enrollment && enrollment.status === 'pending'
                    ? 'Your enrollment is currently pending approval. Please wait for the admin to verify your deposit slip.'
                    : 'You must enroll in this course to gain access to lesson videos, PDFs, and assignment submissions.'}
                </p>
              </div>
            )}

            {/* Videos & Materials Section (Only for active enrollment) */}
            {enrollment && enrollment.status === 'active' && (
              <div className="space-y-10">
                
                {/* Videos */}
                <section>
                  <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
                    <Play className="h-5.5 w-5.5 text-primary fill-current" /> Lecture Videos
                  </h2>
                  {videos && videos.length > 0 ? (
                    <div className="space-y-4">
                      {videos.map((video, index) => {
                        const { title: cleanVideoTitle, thumbnailUrl: videoThumb } = parseVideoTitle(video.title)
                        return (
                          <Link
                            key={video.id}
                            href={`/student/watch/${video.id}`}
                          >
                            <Card className="glass-panel border-border hover:shadow-md hover:border-primary/30 transition-all duration-300 rounded-xl overflow-hidden cursor-pointer group">
                              <CardContent className="p-5 flex items-center gap-4">
                                {videoThumb ? (
                                  <div className="flex-shrink-0 w-16 h-10 rounded-lg overflow-hidden border border-border/40">
                                    <img src={videoThumb} alt={cleanVideoTitle} className="w-full h-full object-cover" />
                                  </div>
                                ) : (
                                  <div className="flex-shrink-0 w-10 h-10 bg-primary/10 text-primary font-bold rounded-xl flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                                    {index + 1}
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-bold text-foreground text-base group-hover:text-primary transition-colors truncate">
                                    {cleanVideoTitle}
                                  </h3>
                                  <p className="text-xs text-muted-foreground mt-0.5">
                                    {video.duration_seconds
                                      ? `Length: ${Math.floor(video.duration_seconds / 60)} minutes`
                                      : 'Recorded Session'}
                                  </p>
                                </div>
                                <div className="text-primary font-bold text-xs uppercase tracking-wider flex items-center gap-1">
                                  Watch <ChevronLeft className="h-4 w-4 rotate-180" />
                                </div>
                              </CardContent>
                            </Card>
                          </Link>
                        )
                      })}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm italic">No videos uploaded for this class yet.</p>
                  )}
                </section>

                {/* PDFs / Materials */}
                <section>
                  <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
                    <FileText className="h-5.5 w-5.5 text-primary" /> Lesson Guides & PDFs
                  </h2>
                  {materials && materials.length > 0 ? (
                    <div className="grid sm:grid-cols-2 gap-4">
                      {materials.map((material) => (
                        <SecurePdfViewer
                          key={material.id}
                          title={material.title}
                          fileUrl={material.file_url}
                          watermark={userProfile?.phone_number || fullName}
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm italic">No PDFs available for this course yet.</p>
                  )}
                </section>

                {/* Assignments Submissions */}
                <section>
                  <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
                    <BadgeCheck className="h-5.5 w-5.5 text-primary" /> Assignments & Submissions
                  </h2>
                  {assignments && assignments.length > 0 ? (
                    <div className="space-y-6">
                      {assignments.map((assignment) => {
                        const ownSubmission = assignment.assignment_submissions?.find(
                          (submission: { user_id: string }) => submission.user_id === user.id
                        )

                        return (
                          <Card key={assignment.id} className="border-border glass-panel rounded-xl overflow-hidden">
                            <CardHeader className="p-5 border-b border-border/40">
                              <div className="flex flex-wrap items-start justify-between gap-3">
                                <div>
                                  <CardTitle className="text-lg font-bold text-foreground">{assignment.title}</CardTitle>
                                  <CardDescription className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5 font-medium">
                                    <Calendar className="h-3.5 w-3.5" />
                                    {assignment.due_at
                                      ? `Due Date: ${new Date(assignment.due_at).toLocaleString()}`
                                      : 'No deadline set'}
                                  </CardDescription>
                                </div>
                                {ownSubmission ? (
                                  <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 px-3 py-1 rounded-full flex items-center gap-1">
                                    <CheckCircle className="h-3 w-3" /> Submitted
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 border border-amber-500/20 text-amber-500 px-3 py-1 rounded-full flex items-center gap-1 animate-pulse">
                                    <Clock className="h-3 w-3" /> Pending Submission
                                  </span>
                                )}
                              </div>
                            </CardHeader>
                            <CardContent className="p-5 space-y-4">
                              {assignment.instructions && (
                                <div className="text-sm text-muted-foreground bg-secondary/20 p-3.5 rounded-xl border border-border/30 leading-relaxed font-medium">
                                  {assignment.instructions}
                                </div>
                              )}
                              
                              {ownSubmission && (
                                <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/5 p-4 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                                  ✓ Submission recorded on {new Date(ownSubmission.submitted_at).toLocaleString()}
                                </div>
                              )}
                              
                              <div className="border-t border-border/40 pt-4">
                                <StudentSubmissionForm
                                  assignmentId={assignment.id}
                                  submitted={Boolean(ownSubmission)}
                                />
                              </div>
                            </CardContent>
                          </Card>
                        )
                      })}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm italic">No assignments posted for this syllabus yet.</p>
                  )}
                </section>

              </div>
            )}

          </div>

          {/* Sidebar */}
          <div>
            <Card className="border-border glass-panel sticky top-24 rounded-2xl overflow-hidden shadow-sm">
              {imageUrl && (
                <div className="w-full h-[180px] relative overflow-hidden border-b border-border/40">
                  <img
                    src={imageUrl}
                    alt={course.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary to-indigo-600" />
              <CardHeader className="p-6 pb-4">
                <CardTitle className="text-2xl sm:text-3.5xl font-bold text-primary">
                  Rs. {Number(course.price).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </CardTitle>
                <CardDescription className="text-xs font-bold uppercase tracking-wider text-muted-foreground mt-1">One-time payment</CardDescription>
              </CardHeader>
              <CardContent className="p-6 pt-0 space-y-4">
                {enrollment ? (
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
                      <p className="text-sm text-foreground font-bold flex items-center justify-between">
                        <span>Enrollment Status:</span>
                        <span className="capitalize text-primary">{enrollment.status}</span>
                      </p>
                    </div>
                    {enrollment.status === 'pending' && (
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Our support team is reviewing your uploaded deposit slip. Your courses will unlock shortly.
                      </p>
                    )}
                  </div>
                ) : (
                  <EnrollmentForm courseId={id} coursePrice={Number(course.price)} />
                )}
              </CardContent>
            </Card>
          </div>

        </div>
      </div>
    </div>
  )
}

