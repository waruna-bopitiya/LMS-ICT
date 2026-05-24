import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { redirect } from 'next/navigation'
import EnrollmentForm from '@/components/EnrollmentForm'
import { requireCompletedProfile } from '@/lib/auth/profile'
import StudentSubmissionForm from '@/components/StudentSubmissionForm'

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

  await requireCompletedProfile(supabase, user.id)

  // Get course details
  const { data: course, error: courseError } = await supabase
    .from('courses')
    .select('*')
    .eq('id', id)
    .single()

  if (courseError || !course) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground mb-4">Course Not Found</h1>
          <Link href="/">
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
              Back to Courses
            </Button>
          </Link>
        </div>
      </div>
    )
  }

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
        <Link
          href="/"
          className="text-primary hover:text-primary/80 transition mb-8 inline-block"
        >
          ← Back to Courses
        </Link>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="md:col-span-2">
            <Card className="border-border mb-8">
              <CardHeader>
                <CardTitle className="text-4xl text-foreground">{course.title}</CardTitle>
                <CardDescription className="text-base mt-2">
                  {course.description || 'No description available'}
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Videos Section */}
            {enrollment && enrollment.status === 'active' ? (
              <div className="space-y-10">
                <section>
                  <h2 className="text-2xl font-bold text-foreground mb-6">Course Videos</h2>
                  {videos && videos.length > 0 ? (
                    <div className="space-y-4">
                      {videos.map((video, index) => (
                        <Link
                          key={video.id}
                          href={`/student/watch/${video.id}`}
                        >
                          <Card className="border-border hover:shadow-lg hover:shadow-primary/10 transition cursor-pointer">
                            <CardContent className="p-6 flex items-center gap-4">
                              <div className="flex-shrink-0 w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                                <span className="text-primary font-bold">{index + 1}</span>
                              </div>
                              <div className="flex-1">
                                <h3 className="font-semibold text-foreground">{video.title}</h3>
                                <p className="text-sm text-muted-foreground">
                                  {video.duration_seconds
                                    ? `${Math.floor(video.duration_seconds / 60)} minutes`
                                    : 'Duration not available'}
                                </p>
                              </div>
                              <div className="text-primary font-semibold">Watch →</div>
                            </CardContent>
                          </Card>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No videos available for this course yet.</p>
                  )}
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-foreground mb-6">Course PDFs</h2>
                  {materials && materials.length > 0 ? (
                    <div className="grid sm:grid-cols-2 gap-4">
                      {materials.map((material) => (
                        <a
                          key={material.id}
                          href={material.file_url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <Card className="border-border hover:shadow-lg hover:shadow-primary/10 transition h-full">
                            <CardContent className="p-6">
                              <div className="text-sm text-primary font-semibold mb-2">PDF</div>
                              <h3 className="font-semibold text-foreground">{material.title}</h3>
                              <p className="text-sm text-muted-foreground mt-2">Open material</p>
                            </CardContent>
                          </Card>
                        </a>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No PDFs available for this course yet.</p>
                  )}
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-foreground mb-6">Submissions</h2>
                  {assignments && assignments.length > 0 ? (
                    <div className="space-y-4">
                      {assignments.map((assignment) => {
                        const ownSubmission = assignment.assignment_submissions?.find(
                          (submission: { user_id: string }) => submission.user_id === user.id
                        )

                        return (
                          <Card key={assignment.id} className="border-border">
                            <CardHeader>
                              <CardTitle className="text-foreground">{assignment.title}</CardTitle>
                              <CardDescription>
                                {assignment.due_at
                                  ? `Due: ${new Date(assignment.due_at).toLocaleString()}`
                                  : 'No due date'}
                              </CardDescription>
                            </CardHeader>
                            <CardContent>
                              {assignment.instructions && (
                                <p className="text-sm text-muted-foreground mb-4">
                                  {assignment.instructions}
                                </p>
                              )}
                              {ownSubmission && (
                                <div className="rounded-md border border-green-500/20 bg-green-500/10 p-3 text-sm text-green-600 dark:text-green-400">
                                  Submitted on {new Date(ownSubmission.submitted_at).toLocaleString()}
                                </div>
                              )}
                              <StudentSubmissionForm
                                assignmentId={assignment.id}
                                submitted={Boolean(ownSubmission)}
                              />
                            </CardContent>
                          </Card>
                        )
                      })}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No submissions available for this course yet.</p>
                  )}
                </section>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-lg text-muted-foreground mb-4">
                  {enrollment && enrollment.status === 'pending'
                    ? 'Your enrollment is pending admin approval. You will be able to access course content once approved.'
                    : 'You need to enroll in this course to view the content.'}
                </p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div>
            <Card className="border-border sticky top-24">
              <CardHeader>
                <CardTitle className="text-2xl">
                  ${Number(course.price).toFixed(2)}
                </CardTitle>
                <CardDescription>One-time payment</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {enrollment ? (
                  <div className="space-y-3">
                    <div className="p-3 rounded-md bg-primary/10">
                      <p className="text-sm text-foreground font-semibold">
                        Status: <span className="capitalize text-primary">{enrollment.status}</span>
                      </p>
                    </div>
                    {enrollment.status === 'pending' && (
                      <p className="text-xs text-muted-foreground">
                        Admin review pending. You will be notified once approved.
                      </p>
                    )}
                  </div>
                ) : (
                  <EnrollmentForm courseId={id} coursePrice={course.price} />
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
