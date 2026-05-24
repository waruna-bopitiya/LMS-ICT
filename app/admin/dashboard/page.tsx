import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { redirect } from 'next/navigation'

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
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="bg-secondary/5 border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <Link href="/admin/dashboard" className="text-2xl font-bold text-primary">
            Admin LMS
          </Link>
          <div className="flex items-center gap-4">
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
          <h1 className="text-4xl font-bold text-foreground mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage courses, videos, and student payments</p>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-12">
          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Courses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{courses?.length || 0}</div>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Enrollments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{enrollments?.length || 0}</div>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pending Payments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{pendingPayments?.length || 0}</div>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active Students
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">
                {new Set(enrollments?.map(e => e.user_id)).size || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6">
          <Link href="/admin/courses">
            <Card className="border-border hover:shadow-lg hover:shadow-primary/10 transition cursor-pointer h-full">
              <CardHeader>
                <CardTitle className="text-foreground">Manage Courses</CardTitle>
                <CardDescription>Create, edit, and delete courses</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                  Go to Courses
                </Button>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/payments">
            <Card className="border-border hover:shadow-lg hover:shadow-primary/10 transition cursor-pointer h-full">
              <CardHeader>
                <CardTitle className="text-foreground">Review Payments</CardTitle>
                <CardDescription>Approve or reject student payments</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                  {pendingPayments && pendingPayments.length > 0
                    ? `Review (${pendingPayments.length})`
                    : 'View Payments'}
                </Button>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/add-course">
            <Card className="border-border hover:shadow-lg hover:shadow-primary/10 transition cursor-pointer h-full">
              <CardHeader>
                <CardTitle className="text-foreground">Create Course</CardTitle>
                <CardDescription>Add a new course with videos</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
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
