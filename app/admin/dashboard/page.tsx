import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { redirect } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { BookOpen, Users, CreditCard, GraduationCap, PlusCircle } from 'lucide-react'

export default async function AdminDashboard() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Check if user is admin
  const { data: userProfile } = await supabase
    .from('users')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!userProfile?.is_admin) {
    redirect('/')
  }

  // Get stats
  const { data: courses } = await supabase.from('courses').select('*')
  const { data: enrollments } = await supabase.from('enrollments').select('*')
  const { data: pendingPayments } = await supabase
    .from('payments')
    .select('*')
    .eq('status', 'pending')

  return (
    <div className="min-h-screen bg-transparent relative overflow-hidden">
      
      {/* Background patterns */}
      <div className="absolute top-0 right-0 -z-10 h-[300px] w-[300px] rounded-full bg-primary/5 blur-[80px] pointer-events-none" />

      {/* Navigation */}
      <Navbar user={user} isAdmin={true} fullName="Administrator" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative z-10">
        {/* Welcome Section */}
        <div className="mb-10 p-6 sm:p-8 rounded-xl border border-border bg-card animate-fade-up">
          <div className="tech-badge mb-4">
            <span className="status-dot" /> Admin Console
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2 tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground text-sm sm:text-base">Manage courses, videos, enrollments, and student payments.</p>
        </div>

        {/* Stats */}
        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-5 mb-12">
          <Card className="tech-card shadow-none">
            <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Total Courses
              </CardTitle>
              <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <BookOpen className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{courses?.length || 0}</div>
            </CardContent>
          </Card>

          <Card className="tech-card shadow-none">
            <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Total Enrollments
              </CardTitle>
              <div className="h-9 w-9 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                <GraduationCap className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{enrollments?.length || 0}</div>
            </CardContent>
          </Card>

          <Card className="tech-card shadow-none">
            <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Pending Payments
              </CardTitle>
              <div className="h-9 w-9 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
                <CreditCard className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{pendingPayments?.length || 0}</div>
            </CardContent>
          </Card>

          <Card className="tech-card shadow-none">
            <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Active Students
              </CardTitle>
              <div className="h-9 w-9 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                <Users className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {new Set(enrollments?.map(e => e.user_id)).size || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <h2 className="text-xl font-semibold text-foreground mb-6 tracking-tight">Quick Actions</h2>
        <div className="grid md:grid-cols-3 gap-5">
          <Link href="/admin/courses">
            <Card className="tech-card shadow-none cursor-pointer h-full">
              <CardHeader>
                <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-3">
                  <BookOpen className="h-5 w-5" />
                </div>
                <CardTitle className="text-foreground font-semibold">Manage Courses</CardTitle>
                <CardDescription>Create, edit, and delete courses</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg">
                  Go to Courses
                </Button>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/payments">
            <Card className="tech-card shadow-none cursor-pointer h-full">
              <CardHeader>
                <div className="h-10 w-10 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center mb-3">
                  <CreditCard className="h-5 w-5" />
                </div>
                <CardTitle className="text-foreground font-semibold">Review Payments</CardTitle>
                <CardDescription>Approve or reject student payments</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg">
                  {pendingPayments && pendingPayments.length > 0
                    ? `Review (${pendingPayments.length})`
                    : 'View Payments'}
                </Button>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/add-course">
            <Card className="tech-card shadow-none cursor-pointer h-full">
              <CardHeader>
                <div className="h-10 w-10 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-3">
                  <PlusCircle className="h-5 w-5" />
                </div>
                <CardTitle className="text-foreground font-semibold">Create Course</CardTitle>
                <CardDescription>Add a new course with videos</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg">
                  Create New
                </Button>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  )
}
