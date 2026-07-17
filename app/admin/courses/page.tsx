import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { redirect } from 'next/navigation'
import Navbar from '@/components/Navbar'

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
    <div className="min-h-screen bg-background relative overflow-hidden">
      
      {/* Background patterns */}
      <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none" />
      
      {/* Navigation */}
      <Navbar user={user} isAdmin={true} fullName="Administrator" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative z-10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-12">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">Manage Courses</h1>
            <p className="text-muted-foreground">Create, edit, and manage your courses syllabus</p>
          </div>
          <Link href="/admin/add-course">
            <Button className="bg-primary hover:bg-primary/95 text-primary-foreground font-semibold px-6 rounded-xl h-11">
              + Create Course
            </Button>
          </Link>
        </div>

        {courses && courses.length > 0 ? (
          <div className="grid gap-6">
            {courses.map((course) => (
              <Link key={course.id} href={`/admin/courses/${course.id}`}>
                <Card className="glass-panel border-border hover:shadow-md hover:border-primary/30 transition-all duration-300 cursor-pointer rounded-2xl overflow-hidden group">
                  <CardHeader className="p-6">
                    <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                      <div className="flex-1">
                        <CardTitle className="text-foreground text-xl font-bold group-hover:text-primary transition-colors">
                          {course.title}
                        </CardTitle>
                        <CardDescription className="mt-2 text-sm text-muted-foreground line-clamp-2">
                          {course.description || 'No description available.'}
                        </CardDescription>
                      </div>
                      <div className="text-left sm:text-right shrink-0">
                        <div className="text-2xl font-bold text-primary">
                          Rs. {Number(course.price).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </div>
                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mt-0.5">Course Fee</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 pt-0 border-t border-border/40 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="text-xs text-muted-foreground font-medium">
                      Created: {new Date(course.created_at).toLocaleDateString()}
                    </div>
                    <Button variant="outline" className="border-border text-foreground hover:bg-secondary font-semibold rounded-xl h-9">
                      Manage Course Contents
                    </Button>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <div className="glass-panel text-center py-16 px-6 max-w-md mx-auto rounded-2xl">
            <h3 className="text-xl font-bold text-foreground mb-2">No Courses Yet</h3>
            <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
              Create your first ICT syllabus course module to get started.
            </p>
            <Link href="/admin/add-course">
              <Button className="bg-primary hover:bg-primary/95 text-primary-foreground font-semibold rounded-xl px-6 h-11">
                Create Course
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
