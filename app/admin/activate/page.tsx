'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Navbar from '@/components/Navbar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { UserCheck, Search, ShieldCheck, GraduationCap, School, MapPin, Phone, AlertCircle, CheckCircle2 } from 'lucide-react'

export default function AdminActivatePage() {
  const router = useRouter()
  const supabase = createClient()
  
  const [user, setUser] = useState<any>(null)
  const [adminProfile, setAdminProfile] = useState<any>(null)
  const [loadingUser, setLoadingUser] = useState(true)

  const [phoneSearch, setPhoneSearch] = useState('')
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState('')
  const [students, setStudents] = useState<any[]>([])
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null)

  const [courses, setCourses] = useState<any[]>([])
  const [selectedCourseId, setSelectedCourseId] = useState('')
  const [activating, setActivating] = useState(false)
  const [activationResult, setActivationResult] = useState<{ success: boolean; message: string } | null>(null)

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
        
        // Fetch courses
        const { data: courseData } = await supabase
          .from('courses')
          .select('id, title, price')
          .order('title', { ascending: true })

        if (courseData) {
          setCourses(courseData)
        }
      } catch (err) {
        console.error('Error verifying admin status:', err)
        router.push('/')
      } finally {
        setLoadingUser(false)
      }
    }

    checkAdmin()
  }, [router, supabase])

  const performSearch = async (query: string) => {
    if (!query.trim()) return

    setSearching(true)
    setSearchError('')
    setStudents([])
    setSelectedStudent(null)
    setActivationResult(null)

    try {
      const response = await fetch(`/api/admin/get-student?phone=${encodeURIComponent(query)}`)
      const data = await response.json()

      if (!response.ok) {
        setSearchError(data.error || 'Failed to search student')
        return
      }

      if (data.students && data.students.length > 0) {
        setStudents(data.students)
        // Auto-select if there is exactly 1 match
        if (data.students.length === 1) {
          setSelectedStudent(data.students[0])
        }
      } else {
        setSearchError('No registered student found with this phone number. Ask them to register first.')
      }
    } catch (err) {
      setSearchError('An error occurred during search. Please try again.')
      console.error(err)
    } finally {
      setSearching(false)
    }
  }

  // Auto-search if search parameters are present in URL
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const phoneParam = params.get('phone')
      if (phoneParam) {
        setPhoneSearch(phoneParam)
        performSearch(phoneParam)
      }
    }
  }, [])

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    performSearch(phoneSearch)
  }

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedStudent || !selectedCourseId) return

    setActivating(true)
    setActivationResult(null)

    try {
      const response = await fetch('/api/admin/manual-enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: selectedStudent.phone_number,
          courseId: selectedCourseId,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setActivationResult({
          success: true,
          message: `${selectedStudent.full_name || 'Student'} successfully activated for the course.`,
        })
        // Clear selected class so they don't double click
        setSelectedCourseId('')
      } else {
        setActivationResult({
          success: false,
          message: data.error || 'Failed to activate course for this student.',
        })
      }
    } catch (err) {
      setActivationResult({
        success: false,
        message: 'An error occurred during activation. Please try again.',
      })
      console.error(err)
    } finally {
      setActivating(false)
    }
  }

  if (loadingUser) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="text-muted-foreground text-sm font-semibold">Loading console...</p>
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

      <div className="max-w-4xl mx-auto px-4 py-10 relative z-10">
        
        {/* Page Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 text-primary shadow-md">
            <UserCheck className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Manual Class Activation</h1>
            <p className="text-muted-foreground text-sm">Instantly activate courses for registered students</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Step 1: Search Form */}
          <Card className="glass-panel border-border rounded-2xl shadow-lg relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary to-violet-600" />
            <CardHeader>
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <Search className="h-5 w-5 text-primary" />
                Find Registered Student
              </CardTitle>
              <CardDescription>
                Search by any format of phone number (e.g. 0764936441, 94764936441, or +94764936441). We will match the suffix.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSearch} className="flex gap-3">
                <Input
                  type="text"
                  placeholder="Enter student's phone number..."
                  value={phoneSearch}
                  onChange={(e) => setPhoneSearch(e.target.value)}
                  className="bg-secondary/20 border-border text-foreground placeholder:text-muted-foreground h-11 rounded-xl focus-visible:ring-primary focus-visible:border-primary"
                  required
                />
                <Button
                  type="submit"
                  disabled={searching || !phoneSearch.trim()}
                  className="bg-primary hover:bg-primary/95 text-primary-foreground font-semibold px-6 rounded-xl h-11 shadow-lg shadow-primary/20"
                >
                  {searching ? 'Searching...' : 'Search'}
                </Button>
              </form>

              {searchError && (
                <div className="mt-4 p-4 bg-destructive/10 border border-destructive/20 text-destructive rounded-xl text-sm flex items-start gap-2 font-semibold">
                  <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                  <span>{searchError}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Multiple matches selection */}
          {students.length > 1 && !selectedStudent && (
            <Card className="glass-panel border-border rounded-2xl shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-foreground">Select Matching Student</CardTitle>
                <CardDescription>Multiple registrations matched the suffix. Please pick the correct student.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {students.map((student) => (
                  <div
                    key={student.id}
                    onClick={() => setSelectedStudent(student)}
                    className="p-4 rounded-xl border border-border/60 bg-secondary/10 hover:bg-secondary/30 hover:border-primary/40 cursor-pointer transition-all flex justify-between items-center"
                  >
                    <div>
                      <h4 className="font-bold text-foreground">
                        {student.full_name || 'Unnamed Student'}
                        {student.student_id && (
                          <span className="ml-2 text-[10px] font-mono bg-secondary px-1.5 py-0.5 rounded text-muted-foreground font-semibold border border-border/60">
                            ID: {student.student_id}
                          </span>
                        )}
                      </h4>
                      <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1">
                        <Phone className="h-3 w-3" /> {student.phone_number}
                        {student.school && (
                          <>
                            <span className="text-border">|</span>
                            <School className="h-3 w-3" /> {student.school}
                          </>
                        )}
                      </p>
                    </div>
                    <Button variant="outline" size="sm" className="rounded-lg font-semibold border-border text-foreground">
                      Select
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Step 2: Student Details & Activation Form */}
          {selectedStudent && (
            <Card className="glass-panel border-border rounded-2xl shadow-lg relative overflow-hidden animate-in fade-in slide-in-from-bottom duration-300">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-primary to-violet-600" />
              <CardHeader className="pb-4">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl font-bold text-foreground">Student Profile</CardTitle>
                    <CardDescription>Details retrieved from database</CardDescription>
                  </div>
                  {students.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedStudent(null)}
                      className="text-xs text-muted-foreground hover:text-foreground"
                    >
                      Change Student
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                
                {/* Student Info Details */}
                <div className="grid sm:grid-cols-2 gap-4 bg-secondary/10 p-4 rounded-xl border border-border/40">
                  {selectedStudent.student_id && (
                    <div className="space-y-1 sm:col-span-2">
                      <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Student ID</span>
                      <p className="font-mono font-bold text-primary text-base">
                        {selectedStudent.student_id}
                      </p>
                    </div>
                  )}

                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Full Name</span>
                    <p className="font-bold text-foreground flex items-center gap-2">
                      <GraduationCap className="h-4.5 w-4.5 text-primary" />
                      {selectedStudent.full_name || <span className="text-muted-foreground italic font-normal">Profile not completed</span>}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Phone Number</span>
                    <p className="font-bold text-foreground flex items-center gap-2">
                      <Phone className="h-4 w-4 text-primary" />
                      {selectedStudent.phone_number}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">School / College</span>
                    <p className="font-semibold text-foreground flex items-center gap-2">
                      <School className="h-4 w-4 text-primary" />
                      {selectedStudent.school || <span className="text-muted-foreground italic font-normal">Not specified</span>}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">District</span>
                    <p className="font-semibold text-foreground flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-primary" />
                      {selectedStudent.district || <span className="text-muted-foreground italic font-normal">Not specified</span>}
                    </p>
                  </div>
                </div>

                {/* Activation Form */}
                <form onSubmit={handleActivate} className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <label htmlFor="course" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Select Course to Activate
                    </label>
                    <select
                      id="course"
                      value={selectedCourseId}
                      onChange={(e) => setSelectedCourseId(e.target.value)}
                      required
                      className="flex h-11 w-full rounded-xl border border-border bg-secondary/20 px-3 py-2 text-sm text-foreground ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="" disabled className="bg-background text-foreground">-- Select a course class --</option>
                      {courses.map((course) => (
                        <option key={course.id} value={course.id} className="bg-background text-foreground">
                          {course.title} - Rs. {Number(course.price).toLocaleString()}
                        </option>
                      ))}
                    </select>
                  </div>

                  <Button
                    type="submit"
                    disabled={activating || !selectedCourseId}
                    className="w-full bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/95 hover:to-indigo-600/95 text-primary-foreground font-semibold h-11 rounded-xl shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
                  >
                    <ShieldCheck className="h-5 w-5" />
                    {activating ? 'Activating Class...' : 'Confirm Activation'}
                  </Button>
                </form>

                {activationResult && (
                  <div className={`p-4 rounded-xl border text-sm flex items-start gap-3.5 font-medium animate-in fade-in duration-200 ${
                    activationResult.success
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
                      : 'bg-destructive/10 border-destructive/20 text-destructive'
                  }`}>
                    {activationResult.success ? (
                      <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                    )}
                    <span>{activationResult.message}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
