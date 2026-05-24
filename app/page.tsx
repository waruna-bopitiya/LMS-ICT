import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { redirect } from 'next/navigation'

export default async function Home() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  let dashboardHref = '/student/dashboard'
  if (user) {
    const { data: profile } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (profile?.is_admin) {
      dashboardHref = '/admin/dashboard'
    }
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
          <Link href="/" className="text-2xl font-bold text-primary">
            LMS
          </Link>
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <Link href={dashboardHref} className="text-foreground hover:text-primary transition">
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
              </>
            ) : (
              <Link href="/auth/login" className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition">
                Login
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-secondary via-background to-background py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            Learn with Our <span className="text-primary">Online Courses</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Enroll in our high-quality courses and start your learning journey today. Watch curated video content and track your progress.
          </p>
          {!user && (
            <Link href="/auth/login">
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-6 text-lg">
                Get Started Now
              </Button>
            </Link>
          )}
        </div>
      </section>

      {/* Courses Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-foreground mb-12 text-center">Available Courses</h2>

          {courses && courses.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course) => (
                <Link key={course.id} href={`/student/courses/${course.id}`}>
                  <Card className="h-full hover:shadow-lg hover:shadow-primary/10 transition border-border">
                    <CardHeader>
                      <CardTitle className="text-foreground">{course.title}</CardTitle>
                      <CardDescription>{course.description || 'No description available'}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-primary">
                          ${Number(course.price).toFixed(2)}
                        </span>
                        <span className="text-sm text-muted-foreground">one-time</span>
                      </div>
                      <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                        View Course
                      </Button>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-lg text-muted-foreground">No courses available yet.</p>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-secondary/10 border-t border-border py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-muted-foreground">
          <p>&copy; 2024 LMS Platform. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
