import AdminCourseManager from '@/components/AdminCourseManager'
import { requireAdmin } from '@/lib/auth/admin'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import Navbar from '@/components/Navbar'

export default async function AdminCourseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { supabase, user } = await requireAdmin()

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

  const [{ data: videos }, { data: materials }, { data: assignmentsData }] =
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
        .select('*, assignment_submissions(*)')
        .eq('course_id', id)
        .order('created_at', { ascending: false }),
    ])

  let assignments = assignmentsData || []
  if (assignmentsData && assignmentsData.length > 0) {
    const userIds = [
      ...new Set(
        assignmentsData
          .flatMap(a => a.assignment_submissions || [])
          .map(s => s.user_id)
      ),
    ]

    if (userIds.length > 0) {
      const { data: usersData } = await supabase
        .from('users')
        .select('id, full_name, phone_number')
        .in('id', userIds)

      const usersMap = new Map(usersData?.map(u => [u.id, u]) || [])
      assignments = assignmentsData.map(a => ({
        ...a,
        assignment_submissions: (a.assignment_submissions || []).map(s => ({
          ...s,
          users: usersMap.get(s.user_id) || { full_name: 'Unknown Student', phone_number: 'N/A' },
        })),
      }))
    }
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      
      {/* Background patterns */}
      <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none" />
      
      {/* Navigation */}
      <Navbar user={user} isAdmin={true} fullName="Administrator" />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative z-10">
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
