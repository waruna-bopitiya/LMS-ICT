import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { redirect } from 'next/navigation'

export default async function AdminCoursesPage() {
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

  // Get all courses
  const { data: courses } = await supabase
    .from('courses')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="bg-secondary/5 border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <Link href="/admin/dashboard" className="text-2xl font-bold text-primary">
            Admin LMS
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/admin/dashboard" className="text-foreground hover:text-primary transition">
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
        <div className="flex items-center justify-between mb-12">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">Manage Courses</h1>
            <p className="text-muted-foreground">Create, edit, and manage your courses</p>
          </div>
          <Link href="/admin/add-course">
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground px-6">
              + Create Course
            </Button>
          </Link>
        </div>

        {courses && courses.length > 0 ? (
          <div className="grid gap-6">
            {courses.map((course) => (
              <Link key={course.id} href={`/admin/courses/${course.id}`}>
                <Card className="border-border hover:shadow-lg hover:shadow-primary/10 transition cursor-pointer">
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-foreground text-xl">
                          {course.title}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          {course.description || 'No description'}
                        </CardDescription>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-primary">
                          ${Number(course.price).toFixed(2)}
                        </div>
                        <p className="text-xs text-muted-foreground">Price</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center">
                      <div className="text-sm text-muted-foreground">
                        Created: {new Date(course.created_at).toLocaleDateString()}
                      </div>
                      <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                        Edit Course
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <h3 className="text-xl font-semibold text-foreground mb-4">No Courses Yet</h3>
            <p className="text-muted-foreground mb-6">
              Create your first course to get started
            </p>
            <Link href="/admin/add-course">
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                Create Course
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
