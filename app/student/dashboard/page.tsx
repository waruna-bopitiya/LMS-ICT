import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { redirect } from 'next/navigation'
import { requireCompletedProfile } from '@/lib/auth/profile'

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
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="bg-secondary/5 border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <Link href="/" className="text-2xl font-bold text-primary">
            LMS
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/" className="text-foreground hover:text-primary transition">
              Browse Courses
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
        {/* Welcome Section */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Welcome, {userProfile?.full_name || 'Student'}!
          </h1>
          <p className="text-muted-foreground">
            Manage your courses and track your learning progress
          </p>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active Courses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">
                {activeEnrollments.length}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pending Approvals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">
                {pendingEnrollments.length}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pending Payments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">
                {pendingPayments?.length || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Active Courses */}
        {activeEnrollments.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-foreground mb-6">My Courses</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {activeEnrollments.map((enrollment) => (
                <Link key={enrollment.id} href={`/student/courses/${enrollment.course_id}`}>
                  <Card className="border-border hover:shadow-lg hover:shadow-primary/10 transition h-full">
                    <CardHeader>
                      <CardTitle className="text-foreground">
                        {enrollment.courses?.title}
                      </CardTitle>
                      <CardDescription>
                        {enrollment.courses?.description || 'No description'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm text-muted-foreground mb-2">
                          <span>Progress</span>
                          <span>0%</span>
                        </div>
                        <div className="w-full bg-secondary/30 rounded-full h-2">
                          <div className="bg-primary h-2 rounded-full w-0" />
                        </div>
                      </div>
                      <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                        Continue Watching
                      </Button>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Pending Enrollments */}
        {pendingEnrollments.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-foreground mb-6">Pending Approval</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {pendingEnrollments.map((enrollment) => (
                <Card key={enrollment.id} className="border-border border-yellow-500/30 bg-yellow-500/5">
                  <CardHeader>
                    <CardTitle className="text-foreground">
                      {enrollment.courses?.title}
                    </CardTitle>
                    <CardDescription>
                      {enrollment.courses?.description || 'No description'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-3 rounded-md bg-yellow-500/10 border border-yellow-500/20">
                      <p className="text-sm font-semibold text-yellow-700 dark:text-yellow-400">
                        ⏳ Awaiting Admin Review
                      </p>
                      <p className="text-xs text-yellow-700/70 dark:text-yellow-400/70 mt-1">
                        Your payment is under review. You will be notified once approved.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* No Active Courses */}
        {activeEnrollments.length === 0 && pendingEnrollments.length === 0 && (
          <div className="text-center py-12">
            <h3 className="text-xl font-semibold text-foreground mb-4">No Courses Yet</h3>
            <p className="text-muted-foreground mb-6">
              Start learning by enrolling in one of our courses
            </p>
            <Link href="/">
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                Browse Courses
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
