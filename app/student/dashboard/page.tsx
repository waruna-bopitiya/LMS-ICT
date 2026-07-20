import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { redirect } from 'next/navigation'
import { requireCompletedProfile } from '@/lib/auth/profile'
import Navbar from '@/components/Navbar'
import { BookOpen, Clock, CreditCard, Play, AlertCircle, ArrowRight } from 'lucide-react'
import { parseCourseDescription } from '@/lib/utils'

export default async function StudentDashboard() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Get user profile
  const userProfile = await requireCompletedProfile(supabase, user.id)

  if (userProfile?.is_admin) {
    redirect('/admin/dashboard')
  }

  // Get all enrollments for this user
  const { data: enrollments } = await supabase
    .from('enrollments')
    .select('*, courses(*)')
    .eq('user_id', user.id)
    .order('enrolled_at', { ascending: false })

  // Get pending payments
  const { data: pendingPayments } = await supabase
    .from('payments')
    .select('*, courses(*)')
    .eq('user_id', user.id)
    .eq('status', 'pending')

  // Get active enrollments
  const activeEnrollments = enrollments?.filter(e => e.status === 'active') || []
  const pendingEnrollments = enrollments?.filter(e => e.status === 'pending') || []

  return (
    <div className="min-h-screen bg-transparent relative overflow-hidden">
      
      {/* Background patterns */}
      <div className="absolute top-0 right-0 -z-10 h-[300px] w-[300px] rounded-full bg-primary/5 blur-[80px] pointer-events-none" />

      {/* Navigation */}
      <Navbar user={user} isAdmin={false} fullName={userProfile?.full_name || ''} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative z-10">

        {/* Welcome Section */}
        <div className="mb-10 p-6 sm:p-8 rounded-xl border border-border bg-card relative overflow-hidden animate-fade-up">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2 tracking-tight">
                Welcome back, <span className="text-gradient">{userProfile?.full_name || 'Student'}</span>
              </h1>
              <p className="text-muted-foreground text-sm sm:text-base max-w-xl">
                Keep up the excellent work. Track your watch percentage, download materials, and submit assignments.
              </p>
            </div>
            {userProfile?.student_id && (
              <div className="shrink-0 self-start sm:self-center bg-secondary/80 border border-border px-4 py-2 rounded-lg font-mono text-sm font-semibold text-foreground shadow-xs">
                Student ID: {userProfile.student_id}
              </div>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid sm:grid-cols-3 gap-5 mb-12">

          <Card className="tech-card shadow-none">
            <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Active Courses
              </CardTitle>
              <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <BookOpen className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {activeEnrollments.length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Ready for study</p>
            </CardContent>
          </Card>

          <Card className="tech-card shadow-none">
            <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Pending Approvals
              </CardTitle>
              <div className="h-9 w-9 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
                <Clock className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {pendingEnrollments.length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Awaiting admin review</p>
            </CardContent>
          </Card>

          <Card className="tech-card shadow-none">
            <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Pending Slips
              </CardTitle>
              <div className="h-9 w-9 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                <CreditCard className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {pendingPayments?.length || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Proof uploaded</p>
            </CardContent>
          </Card>

        </div>

        {/* Active Courses */}
        {activeEnrollments.length > 0 && (
          <div className="mb-12">
            <h2 className="text-xl font-semibold text-foreground mb-6 flex items-center gap-2 tracking-tight">
              <BookOpen className="h-5 w-5 text-primary" /> My Subscribed Courses
            </h2>
            <div className="grid md:grid-cols-2 gap-5">
              {activeEnrollments.map((enrollment) => {
                const { description: cleanDesc, imageUrl } = parseCourseDescription(enrollment.courses?.description)
                return (
                  <Link key={enrollment.id} href={`/student/courses/${enrollment.course_id}`}>
                    <Card className="tech-card shadow-none h-full flex flex-col justify-between overflow-hidden cursor-pointer group p-0">
                      <div>
                        <div className="w-full h-40 relative overflow-hidden border-b border-border bg-zinc-950 flex items-center justify-center">
                          <img
                            src={imageUrl || "/default-course.jpg"}
                            alt={enrollment.courses?.title}
                            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                        <CardHeader className="p-6">
                          <CardTitle className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                            {enrollment.courses?.title}
                          </CardTitle>
                          <CardDescription className="text-sm text-muted-foreground mt-2 line-clamp-2">
                            {cleanDesc || 'No description available.'}
                          </CardDescription>
                        </CardHeader>
                      </div>

                      <CardContent className="p-6 pt-0 space-y-5">
                        <div className="border-t border-border pt-4">
                          <div className="flex justify-between text-xs font-semibold text-muted-foreground mb-2">
                            <span>Class Progress</span>
                            <span className="text-foreground">0%</span>
                          </div>
                          <div className="w-full bg-secondary rounded-full h-1.5 overflow-hidden">
                            <div className="bg-primary h-1.5 rounded-full w-0 transition-all duration-500" />
                          </div>
                        </div>
                        <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg gap-2 h-11">
                          <Play className="h-4 w-4 fill-current" /> Access Content
                        </Button>
                      </CardContent>
                    </Card>
                  </Link>
                )
              })}
            </div>
          </div>
        )}

        {/* Pending Enrollments */}
        {pendingEnrollments.length > 0 && (
          <div className="mb-12">
            <h2 className="text-xl font-semibold text-foreground mb-6 flex items-center gap-2 tracking-tight">
              <Clock className="h-5 w-5 text-amber-500" /> Pending Approvals
            </h2>
            <div className="grid md:grid-cols-2 gap-5">
              {pendingEnrollments.map((enrollment) => {
                const { description: cleanDesc, imageUrl } = parseCourseDescription(enrollment.courses?.description)
                return (
                  <Card key={enrollment.id} className="border-amber-500/25 bg-amber-500/5 rounded-xl overflow-hidden flex flex-col justify-between p-0 shadow-none">
                    <div>
                      <div className="w-full h-40 relative overflow-hidden border-b border-amber-500/15 bg-zinc-950 flex items-center justify-center">
                        <img
                          src={imageUrl || "/default-course.jpg"}
                          alt={enrollment.courses?.title}
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <CardHeader className="p-6">
                        <CardTitle className="text-lg font-semibold text-foreground">
                          {enrollment.courses?.title}
                        </CardTitle>
                        <CardDescription className="text-sm text-muted-foreground mt-2 line-clamp-2">
                          {cleanDesc || 'No description available.'}
                        </CardDescription>
                      </CardHeader>
                    </div>
                    <CardContent className="p-6 pt-0">
                      <div className="flex items-start gap-3 p-4 rounded-lg bg-amber-500/10 border border-amber-500/20 mb-4">
                        <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">
                            Awaiting Admin Review
                          </p>
                          <p className="text-xs text-amber-700/80 dark:text-amber-400/80 mt-1 leading-relaxed">
                            Your bank slip is currently being reviewed. Your course materials and lessons will unlock immediately once approved.
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        )}

        {/* No Active or Pending Courses */}
        {activeEnrollments.length === 0 && pendingEnrollments.length === 0 && (
          <div className="tech-card shadow-none text-center py-16 px-6 max-w-lg mx-auto mt-10">
            <BookOpen className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">No Active Courses</h3>
            <p className="text-muted-foreground text-sm mb-8 leading-relaxed max-w-md mx-auto">
              You are not enrolled in any courses yet. Browse our list of AL ICT course modules and start learning today!
            </p>
            <Link href="/">
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg px-6 h-11 gap-1.5">
                Browse Courses <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
