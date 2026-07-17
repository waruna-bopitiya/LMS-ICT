'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Navbar from '@/components/Navbar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, BookOpen, Search, UserCheck, GraduationCap, School, MapPin, Phone, Calendar, ArrowUpRight, Shield } from 'lucide-react'

export default function AdminStudentsPage() {
  const router = useRouter()
  const supabase = createClient()

  const [user, setUser] = useState<any>(null)
  const [adminProfile, setAdminProfile] = useState<any>(null)
  const [loadingUser, setLoadingUser] = useState(true)

  const [activeTab, setActiveTab] = useState<'students' | 'enrollments'>('students')
  const [students, setStudents] = useState<any[]>([])
  const [enrollments, setEnrollments] = useState<any[]>([])
  const [courses, setCourses] = useState<any[]>([])
  const [loadingData, setLoadingData] = useState(true)

  // Search & Filter state
  const [studentSearch, setStudentSearch] = useState('')
  const [enrollmentSearch, setEnrollmentSearch] = useState('')
  const [selectedCourseFilter, setSelectedCourseFilter] = useState('')

  useEffect(() => {
    async function checkAdmin() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/auth/login')
          return
        }

        const { data: profile } = await supabase
          .from('users')
          .select('is_admin, full_name')
          .eq('id', user.id)
          .single()

        if (!profile?.is_admin) {
          router.push('/')
          return
        }

        setUser(user)
        setAdminProfile(profile)
        
        // Fetch all data
        await Promise.all([
          fetchStudents(),
          fetchEnrollments(),
          fetchCourses()
        ])

      } catch (err) {
        console.error('Error fetching admin directory data:', err)
        router.push('/')
      } finally {
        setLoadingUser(false)
        setLoadingData(false)
      }
    }

    async function fetchStudents() {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('is_admin', false)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching students:', error)
      } else {
        setStudents(data || [])
      }
    }

    async function fetchEnrollments() {
      const { data: enrollmentsData, error: enrollError } = await supabase
        .from('enrollments')
        .select(`
          id,
          status,
          enrolled_at,
          user_id,
          course_id,
          courses (
            title,
            price
          ),
          payments (
            bank_slip_url,
            status
          )
        `)
        .order('enrolled_at', { ascending: false })

      if (enrollError) {
        console.error('Error fetching enrollments:', enrollError)
        return
      }

      if (enrollmentsData && enrollmentsData.length > 0) {
        const userIds = [...new Set(enrollmentsData.map(e => e.user_id))]
        const { data: usersData, error: usersError } = await supabase
          .from('users')
          .select('id, full_name, phone_number, school, district')
          .in('id', userIds)

        if (usersError) {
          console.error('Error fetching enrollment users:', usersError)
        }

        const usersMap = new Map(usersData?.map(u => [u.id, u]) || [])
        const mergedEnrollments = enrollmentsData.map(e => ({
          ...e,
          users: usersMap.get(e.user_id) || {
            full_name: 'Unknown Student',
            phone_number: 'N/A',
            school: 'N/A',
            district: 'N/A'
          }
        }))
        setEnrollments(mergedEnrollments)
      } else {
        setEnrollments([])
      }
    }

    async function fetchCourses() {
      const { data, error } = await supabase
        .from('courses')
        .select('id, title')
        .order('title', { ascending: true })

      if (error) {
        console.error('Error fetching courses:', error)
      } else {
        setCourses(data || [])
      }
    }

    checkAdmin()
  }, [router, supabase])

  // Filter students based on search
  const filteredStudents = students.filter(student => {
    const term = studentSearch.toLowerCase()
    return (
      (student.full_name || '').toLowerCase().includes(term) ||
      (student.phone_number || '').toLowerCase().includes(term) ||
      (student.school || '').toLowerCase().includes(term) ||
      (student.district || '').toLowerCase().includes(term)
    )
  })

  // Filter enrollments based on search and selected course
  const filteredEnrollments = enrollments.filter(enrollment => {
    const term = enrollmentSearch.toLowerCase()
    const studentMatches =
      (enrollment.users?.full_name || '').toLowerCase().includes(term) ||
      (enrollment.users?.phone_number || '').toLowerCase().includes(term) ||
      (enrollment.courses?.title || '').toLowerCase().includes(term)

    const courseMatches = selectedCourseFilter 
      ? enrollment.course_id === selectedCourseFilter
      : true

    return studentMatches && courseMatches
  })

  if (loadingUser) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="text-muted-foreground text-sm font-semibold">Loading directory...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background patterns */}
      <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none" />
      
      {/* Navigation */}
      <Navbar user={user} isAdmin={true} fullName={adminProfile?.full_name || 'Administrator'} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-10">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-1 tracking-tight flex items-center gap-2">
              Student Directory
            </h1>
            <p className="text-muted-foreground">Monitor registrations and class enrollment activities</p>
          </div>
          <Button
            onClick={() => router.push('/admin/activate')}
            className="bg-primary hover:bg-primary/95 text-primary-foreground font-semibold px-6 rounded-xl h-11 shadow-lg shadow-primary/20 flex items-center gap-2 self-start sm:self-auto"
          >
            <UserCheck className="h-4.5 w-4.5" />
            Manual Enroll Student
          </Button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-border/80 mb-8 gap-6">
          <button
            onClick={() => setActiveTab('students')}
            className={`pb-4 text-base font-bold transition-all relative flex items-center gap-2 ${
              activeTab === 'students'
                ? 'text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Users className="h-5 w-5" />
            Registered Students
            <span className="text-xs bg-primary/10 border border-primary/20 text-primary px-2.5 py-0.5 rounded-full font-semibold">
              {students.length}
            </span>
            {activeTab === 'students' && (
              <div className="absolute bottom-0 inset-x-0 h-0.5 bg-primary rounded-full" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('enrollments')}
            className={`pb-4 text-base font-bold transition-all relative flex items-center gap-2 ${
              activeTab === 'enrollments'
                ? 'text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <BookOpen className="h-5 w-5" />
            Course Enrollments
            <span className="text-xs bg-primary/10 border border-primary/20 text-primary px-2.5 py-0.5 rounded-full font-semibold">
              {enrollments.length}
            </span>
            {activeTab === 'enrollments' && (
              <div className="absolute bottom-0 inset-x-0 h-0.5 bg-primary rounded-full" />
            )}
          </button>
        </div>

        {/* Dynamic Tab Content */}
        {loadingData ? (
          <div className="glass-panel text-center py-20 rounded-2xl">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">Retrieving database directories...</p>
          </div>
        ) : activeTab === 'students' ? (
          
          /* REGISTERED STUDENTS TAB */
          <div className="space-y-6">
            
            {/* Search Box */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search students by name, phone, school or district..."
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  className="bg-secondary/20 border-border text-foreground placeholder:text-muted-foreground pl-10 h-11 rounded-xl focus-visible:ring-primary focus-visible:border-primary"
                />
              </div>
            </div>

            {/* List / Table */}
            {filteredStudents.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredStudents.map((student) => (
                  <Card key={student.id} className="glass-panel border-border hover:shadow-md hover:border-primary/20 transition-all rounded-2xl overflow-hidden group">
                    <CardHeader className="p-5 pb-3">
                      <div className="flex justify-between items-start gap-2">
                        <CardTitle className="text-lg font-bold text-foreground line-clamp-1">
                          {student.full_name || <span className="text-muted-foreground italic font-normal text-sm">Profile Incomplete</span>}
                        </CardTitle>
                        <span className="text-[10px] bg-secondary/60 text-muted-foreground font-semibold px-2 py-0.5 rounded-md flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(student.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <CardDescription className="flex items-center gap-1 text-sm text-primary font-bold mt-1">
                        <Phone className="h-3.5 w-3.5" />
                        {student.phone_number}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-5 pt-0 space-y-4">
                      <div className="space-y-1.5 text-xs text-muted-foreground border-t border-border/40 pt-3">
                        <div className="flex items-center gap-2">
                          <School className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <span className="truncate">School: {student.school || <span className="italic text-muted-foreground/60">Not set</span>}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <span>District: {student.district || <span className="italic text-muted-foreground/60">Not set</span>}</span>
                        </div>
                        {student.guardian_phone && (
                          <div className="flex items-center gap-2">
                            <Shield className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            <span>Guardian: {student.guardian_phone}</span>
                          </div>
                        )}
                      </div>

                      <Button
                        onClick={() => router.push(`/admin/activate?phone=${encodeURIComponent(student.phone_number || '')}`)}
                        variant="outline"
                        className="w-full justify-between border-border text-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary rounded-xl h-9.5 text-xs font-semibold group-hover:border-primary/30 transition-all"
                      >
                        <span>Manual Enroll & Activate</span>
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="glass-panel text-center py-16 rounded-2xl">
                <p className="text-muted-foreground text-sm font-semibold">No students match your search parameters.</p>
              </div>
            )}

          </div>
        ) : (
          
          /* COURSE ENROLLMENTS TAB */
          <div className="space-y-6">
            
            {/* Search Box & Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search enrollments by student name, phone or class title..."
                  value={enrollmentSearch}
                  onChange={(e) => setEnrollmentSearch(e.target.value)}
                  className="bg-secondary/20 border-border text-foreground placeholder:text-muted-foreground pl-10 h-11 rounded-xl focus-visible:ring-primary focus-visible:border-primary"
                />
              </div>
              
              <select
                value={selectedCourseFilter}
                onChange={(e) => setSelectedCourseFilter(e.target.value)}
                className="flex h-11 w-full sm:w-[240px] rounded-xl border border-border bg-secondary/20 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              >
                <option value="" className="bg-background text-foreground">-- All Courses --</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id} className="bg-background text-foreground">
                    {course.title}
                  </option>
                ))}
              </select>
            </div>

            {/* List / Table */}
            {filteredEnrollments.length > 0 ? (
              <div className="border border-border/80 rounded-2xl bg-card/20 backdrop-blur-md overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-border bg-secondary/30 text-xs text-muted-foreground font-bold uppercase tracking-wider">
                        <th className="p-4 sm:p-5">Student</th>
                        <th className="p-4 sm:p-5">Class Course</th>
                        <th className="p-4 sm:p-5">Enroll Date</th>
                        <th className="p-4 sm:p-5">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60 text-sm">
                      {filteredEnrollments.map((enrollment) => (
                        <tr key={enrollment.id} className="hover:bg-secondary/10 transition-colors text-foreground">
                          <td className="p-4 sm:p-5">
                            <div>
                              <div className="font-bold">
                                {enrollment.users?.full_name || <span className="text-muted-foreground italic font-normal">Profile Incomplete</span>}
                              </div>
                              <div className="text-xs text-muted-foreground font-semibold flex items-center gap-1 mt-0.5">
                                <Phone className="h-3 w-3 text-primary" /> {enrollment.users?.phone_number || 'N/A'}
                              </div>
                            </div>
                          </td>
                          <td className="p-4 sm:p-5">
                            <div>
                              <div className="font-bold text-foreground">{enrollment.courses?.title || 'Unknown Course'}</div>
                              <div className="text-xs text-primary font-bold mt-0.5">
                                Rs. {Number(enrollment.courses?.price || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                              </div>
                            </div>
                          </td>
                          <td className="p-4 sm:p-5 text-xs text-muted-foreground">
                            {new Date(enrollment.enrolled_at).toLocaleDateString()} {new Date(enrollment.enrolled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="p-4 sm:p-5">
                            <div className="flex flex-col gap-1.5 items-start">
                              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                                enrollment.status === 'active'
                                  ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-500'
                                  : 'bg-amber-500/10 border border-amber-500/20 text-amber-500'
                              }`}>
                                <span className={`h-1.5 w-1.5 rounded-full ${
                                  enrollment.status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                                }`} />
                                {enrollment.status === 'active' ? 'Active' : 'Pending Approval'}
                              </span>
                              
                              {enrollment.payments && enrollment.payments.bank_slip_url && enrollment.payments.bank_slip_url !== 'manual-admin-activation' && (
                                <a
                                  href={enrollment.payments.bank_slip_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1 mt-0.5 bg-primary/5 px-2 py-0.5 rounded border border-primary/20"
                                >
                                  📄 View Slip
                                </a>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="glass-panel text-center py-16 rounded-2xl">
                <p className="text-muted-foreground text-sm font-semibold">No enrollments match your criteria.</p>
              </div>
            )}

          </div>
        )}

      </div>
    </div>
  )
}
