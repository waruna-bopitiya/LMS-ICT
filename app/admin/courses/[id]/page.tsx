import AdminCourseManager from '@/components/AdminCourseManager'
import { requireAdmin } from '@/lib/auth/admin'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function AdminCourseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { supabase } = await requireAdmin()

  const { data: course } = await supabase
    .from('courses')
    .select('*')
    .eq('id', id)
    .single()

  if (!course) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground mb-4">Class Not Found</h1>
          <Link href="/admin/courses">
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
              Back to Classes
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  const [{ data: videos }, { data: materials }, { data: assignments }] =
    await Promise.all([
      supabase
        .from('videos')
        .select('*')
        .eq('course_id', id)
        .order('sequence_order', { ascending: true }),
      supabase
        .from('course_materials')
        .select('*')
        .eq('course_id', id)
        .order('sequence_order', { ascending: true }),
      supabase
        .from('assignments')
        .select('*, assignment_submissions(*, users(full_name, phone_number))')
        .eq('course_id', id)
        .order('created_at', { ascending: false }),
    ])

  return (
    <div className="min-h-screen bg-background">
      <nav className="bg-secondary/5 border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <Link href="/admin/dashboard" className="text-2xl font-bold text-primary">
            Admin LMS
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/admin/payments" className="text-foreground hover:text-primary transition">
              Payments
            </Link>
            <Link href="/admin/courses" className="text-foreground hover:text-primary transition">
              Classes
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link href="/admin/courses" className="text-primary hover:text-primary/80 transition mb-6 inline-block">
          Back to Classes
        </Link>
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">{course.title}</h1>
          <p className="text-muted-foreground">Manage videos, PDFs, submissions, and payment amount.</p>
        </div>
        <AdminCourseManager
          course={course}
          videos={videos || []}
          materials={materials || []}
          assignments={assignments || []}
        />
      </main>
    </div>
  )
}
