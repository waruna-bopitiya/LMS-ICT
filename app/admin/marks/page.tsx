'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ArrowLeft, Award, Plus, Search, Trash2, RefreshCw, Calculator, FileText, BookOpen } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { toast } from 'sonner'
import Link from 'next/link'

interface Paper {
  id: string
  name: string
  total_marks: number
  created_at: string
}

interface MarkRecord {
  id: string
  user_id: string
  student_id: number
  full_name: string
  paper_id: string
  paper_name: string
  marks_obtained: number
  total_marks: number
  percentage: number
  rank: number
  total_participants: number
  created_at: string
}

export default function AdminMarksPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [isAdmin, setIsAdmin] = useState(false)
  const [fetchingAdmin, setFetchingAdmin] = useState(true)

  // Paper creation form state
  const [paperName, setPaperName] = useState('')
  const [paperTotalMarks, setPaperTotalMarks] = useState('100')
  const [creatingPaper, setCreatingPaper] = useState(false)

  // Student Score form state
  const [form, setForm] = useState({
    studentId: '',
    paperId: '',
    marksObtained: '',
  })
  const [submittingScore, setSubmittingScore] = useState(false)

  // Data states
  const [papers, setPapers] = useState<Paper[]>([])
  const [records, setRecords] = useState<MarkRecord[]>([])
  const [loadingPapers, setLoadingPapers] = useState(true)
  const [loadingRecords, setLoadingRecords] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  // Verify Admin role
  useEffect(() => {
    async function checkRole() {
      if (authLoading) return
      if (!user) {
        router.push('/auth/login')
        return
      }

      try {
        const response = await fetch('/api/student/profile')
        if (response.ok) {
          const data = await response.json()
          if (data.profile?.is_admin) {
            setIsAdmin(true)
          } else {
            router.push('/student/dashboard')
          }
        } else {
          router.push('/auth/login')
        }
      } catch (err) {
        console.error('Error verifying admin:', err)
        router.push('/auth/login')
      } finally {
        setFetchingAdmin(false)
      }
    }

    checkRole()
  }, [user, authLoading, router])

  // Fetch all papers
  const fetchPapers = async () => {
    setLoadingPapers(true)
    try {
      const response = await fetch('/api/admin/papers')
      if (response.ok) {
        const data = await response.json()
        setPapers(data.papers || [])
      }
    } catch (err) {
      console.error('Error fetching papers:', err)
    } finally {
      setLoadingPapers(false)
    }
  }

  // Fetch entered marks
  const fetchRecords = async (query = '') => {
    setLoadingRecords(true)
    try {
      const response = await fetch(`/api/admin/marks?search=${encodeURIComponent(query)}`)
      if (response.ok) {
        const data = await response.json()
        setRecords(data.marks || [])
      }
    } catch (err) {
      console.error('Error loading marks:', err)
    } finally {
      setLoadingRecords(false)
    }
  }

  useEffect(() => {
    if (isAdmin) {
      fetchPapers()
      fetchRecords(searchQuery)
    }
  }, [isAdmin, searchQuery])

  // Create new paper
  const handleCreatePaper = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!paperName.trim() || !paperTotalMarks) {
      toast.error('Please enter paper name and total marks')
      return
    }

    const totalNum = Number(paperTotalMarks)
    if (isNaN(totalNum) || totalNum <= 0) {
      toast.error('Total marks must be a positive number')
      return
    }

    setCreatingPaper(true)
    try {
      const response = await fetch('/api/admin/papers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: paperName, totalMarks: totalNum })
      })

      const data = await response.json()
      if (response.ok) {
        toast.success(`Paper "${paperName}" created successfully!`)
        setPaperName('')
        fetchPapers()
      } else {
        toast.error(data.error || 'Failed to create paper')
      }
    } catch (err) {
      console.error('Error creating paper:', err)
      toast.error('An error occurred while creating the paper')
    } finally {
      setCreatingPaper(false)
    }
  }

  // Delete paper
  const handleDeletePaper = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete paper "${name}"? This will delete all student marks entered for this paper!`)) {
      return
    }

    try {
      const response = await fetch(`/api/admin/papers?id=${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success(`Deleted paper "${name}"`)
        fetchPapers()
        fetchRecords(searchQuery)
      } else {
        const data = await response.json()
        toast.error(data.error || 'Failed to delete paper')
      }
    } catch (err) {
      console.error('Error deleting paper:', err)
      toast.error('An error occurred during deletion')
    }
  }

  // Handle score input change
  const handleScoreFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm(prev => ({
      ...prev,
      [e.target.id]: e.target.value
    }))
  }

  // Save student marks score
  const handleSaveScore = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.studentId || !form.paperId || form.marksObtained === '') {
      toast.error('Please select student ID, paper, and marks obtained')
      return
    }

    const marksNum = Number(form.marksObtained)
    const selectedPaper = papers.find(p => p.id === form.paperId)

    if (!selectedPaper) {
      toast.error('Selected paper not found')
      return
    }

    if (isNaN(marksNum) || marksNum < 0 || marksNum > selectedPaper.total_marks) {
      toast.error(`Marks obtained must be between 0 and ${selectedPaper.total_marks}`)
      return
    }

    setSubmittingScore(true)
    try {
      const response = await fetch('/api/admin/marks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: form.studentId,
          paperId: form.paperId,
          marksObtained: marksNum
        })
      })

      const data = await response.json()
      if (response.ok) {
        toast.success(`Marks saved for Student ID ${form.studentId}`)
        // Clear only student ID and score to quickly add marks for same paper
        setForm(prev => ({
          ...prev,
          studentId: '',
          marksObtained: ''
        }))
        fetchRecords(searchQuery)
      } else {
        toast.error(data.error || 'Failed to save score')
      }
    } catch (err) {
      console.error('Error saving score:', err)
      toast.error('An error occurred while saving marks')
    } finally {
      setSubmittingScore(false)
    }
  }

  // Delete student marks entry
  const handleDeleteRecord = async (id: string, studentId: number, paper: string) => {
    if (!confirm(`Delete score entry for Student ID ${studentId} on "${paper}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/admin/marks?id=${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Record deleted successfully')
        fetchRecords(searchQuery)
      } else {
        const data = await response.json()
        toast.error(data.error || 'Failed to delete record')
      }
    } catch (err) {
      console.error('Error deleting record:', err)
      toast.error('An error occurred during deletion')
    }
  }

  // Percentage Preview Calculation
  const getPercentagePreview = () => {
    const marks = Number(form.marksObtained)
    const selectedPaper = papers.find(p => p.id === form.paperId)
    if (selectedPaper && !isNaN(marks) && marks >= 0 && marks <= selectedPaper.total_marks) {
      return ((marks / selectedPaper.total_marks) * 100).toFixed(2)
    }
    return null
  }

  if (authLoading || fetchingAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="h-8 w-8 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground font-medium">Verifying admin access...</p>
        </div>
      </div>
    )
  }

  if (!isAdmin) return null

  return (
    <div className="min-h-screen bg-transparent relative overflow-hidden flex flex-col justify-between">
      <div>
        <Navbar user={user} isAdmin={true} fullName="Administrator" />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          {/* Header */}
          <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <Link
                href="/admin/dashboard"
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors font-medium mb-4"
              >
                <ArrowLeft className="h-4 w-4" /> Back to Dashboard
              </Link>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                <Award className="h-8 w-8 text-primary" /> Manage Exam Marks
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Configure papers, assign scores to Student IDs, and track dynamically computed class rankings.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left side Forms */}
            <div className="lg:col-span-1 space-y-8">
              {/* Card 1: Create Paper */}
              <Card className="bg-card/75 border-border shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" /> Create Exam Paper
                  </CardTitle>
                  <CardDescription>Configure a new paper and its maximum marks limit.</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCreatePaper} className="space-y-4">
                    <div className="space-y-2">
                      <label htmlFor="paperName" className="text-sm font-medium text-foreground">
                        Paper Name *
                      </label>
                      <Input
                        id="paperName"
                        type="text"
                        placeholder="e.g. AL 2028 Mock Paper 01"
                        value={paperName}
                        onChange={(e) => setPaperName(e.target.value)}
                        required
                        className="bg-secondary/15 border-border"
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="paperTotalMarks" className="text-sm font-medium text-foreground">
                        Total Marks (Out Of) *
                      </label>
                      <Input
                        id="paperTotalMarks"
                        type="number"
                        placeholder="e.g. 60"
                        value={paperTotalMarks}
                        onChange={(e) => setPaperTotalMarks(e.target.value)}
                        required
                        className="bg-secondary/15 border-border"
                      />
                    </div>

                    <Button type="submit" disabled={creatingPaper} className="w-full font-semibold">
                      {creatingPaper ? (
                        <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Plus className="h-4 w-4 mr-2" />
                      )}
                      Create Paper
                    </Button>
                  </form>

                  {/* List of existing papers */}
                  <div className="mt-6 border-t border-border pt-4">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                      Configured Papers ({papers.length})
                    </h4>
                    {loadingPapers ? (
                      <p className="text-xs text-muted-foreground">Loading papers...</p>
                    ) : papers.length === 0 ? (
                      <p className="text-xs text-muted-foreground italic">No papers configured yet.</p>
                    ) : (
                      <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                        {papers.map((p) => (
                          <div key={p.id} className="flex justify-between items-center p-2 rounded-lg bg-secondary/10 border border-border/40 text-xs">
                            <div>
                              <span className="font-semibold text-foreground">{p.name}</span>
                              <span className="text-muted-foreground ml-1">(Total: {p.total_marks})</span>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-destructive hover:bg-destructive/10 hover:text-destructive"
                              onClick={() => handleDeletePaper(p.id, p.name)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Card 2: Save Score */}
              <Card className="bg-card/75 border-border shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Plus className="h-5 w-5 text-primary" /> Enter Student Score
                  </CardTitle>
                  <CardDescription>Assign marks to a student based on Student ID.</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSaveScore} className="space-y-4">
                    <div className="space-y-2">
                      <label htmlFor="studentId" className="text-sm font-medium text-foreground">
                        Student ID *
                      </label>
                      <Input
                        id="studentId"
                        type="number"
                        placeholder="e.g. 1001"
                        value={form.studentId}
                        onChange={handleScoreFormChange}
                        required
                        className="bg-secondary/15 border-border"
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="paperId" className="text-sm font-medium text-foreground">
                        Select Paper *
                      </label>
                      <select
                        id="paperId"
                        value={form.paperId}
                        onChange={handleScoreFormChange}
                        required
                        className="w-full flex h-9.5 rounded-md border border-border bg-secondary/15 text-foreground px-3 py-1.5 text-sm ring-offset-background focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="" className="bg-popover text-popover-foreground">-- Choose Paper --</option>
                        {papers.map((p) => (
                          <option key={p.id} value={p.id} className="bg-popover text-popover-foreground">
                            {p.name} (Total: {p.total_marks})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="marksObtained" className="text-sm font-medium text-foreground">
                        Marks Obtained *
                      </label>
                      <Input
                        id="marksObtained"
                        type="number"
                        step="any"
                        placeholder="e.g. 45"
                        value={form.marksObtained}
                        onChange={handleScoreFormChange}
                        required
                        className="bg-secondary/15 border-border"
                      />
                    </div>

                    {getPercentagePreview() && (
                      <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-between text-xs text-foreground">
                        <div className="flex items-center gap-1.5">
                          <Calculator className="h-4.5 w-4.5 text-primary" />
                          <span>Calculated Percentage:</span>
                        </div>
                        <strong className="text-primary font-bold">{getPercentagePreview()}%</strong>
                      </div>
                    )}

                    <Button type="submit" disabled={submittingScore} className="w-full font-semibold">
                      {submittingScore ? (
                        <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Plus className="h-4 w-4 mr-2" />
                      )}
                      Save Score
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Right side Records table */}
            <div className="lg:col-span-2 space-y-4">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search marks by student name, ID, or paper..."
                  className="pl-10 bg-card/60 border-border"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Records Card */}
              <Card className="bg-card/75 border-border shadow-lg">
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs uppercase bg-secondary/35 text-muted-foreground border-b border-border">
                        <tr>
                          <th className="px-6 py-4">Student ID</th>
                          <th className="px-6 py-4">Name</th>
                          <th className="px-6 py-4">Paper Name</th>
                          <th className="px-6 py-4 text-center">Score</th>
                          <th className="px-6 py-4 text-center">Percentage</th>
                          <th className="px-6 py-4 text-center">Rank</th>
                          <th className="px-6 py-4 text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/60">
                        {loadingRecords ? (
                          <tr>
                            <td colSpan={7} className="text-center py-10 text-muted-foreground">
                              <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2" />
                              Loading student marks records...
                            </td>
                          </tr>
                        ) : records.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="text-center py-10 text-muted-foreground">
                              No marks records found.
                            </td>
                          </tr>
                        ) : (
                          records.map((record) => (
                            <tr key={record.id} className="hover:bg-secondary/15 transition-colors">
                              <td className="px-6 py-4 font-mono font-medium text-foreground">
                                {record.student_id}
                              </td>
                              <td className="px-6 py-4 font-medium text-foreground">
                                {record.full_name}
                              </td>
                              <td className="px-6 py-4 text-muted-foreground">
                                {record.paper_name}
                              </td>
                              <td className="px-6 py-4 text-center text-foreground font-semibold">
                                {record.marks_obtained} / {record.total_marks}
                              </td>
                              <td className="px-6 py-4 text-center text-primary font-bold">
                                {record.percentage}%
                              </td>
                              <td className="px-6 py-4 text-center">
                                <span className="inline-flex items-center justify-center rounded-full bg-primary/10 border border-primary/20 px-2.5 py-0.5 text-xs font-semibold text-primary">
                                  {record.rank} / {record.total_participants}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-center">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                                  onClick={() => handleDeleteRecord(record.id, record.student_id, record.paper_name)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>

      <footer className="border-t border-border py-6 bg-background/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} I See ICT by Waruna Bopitiya. All rights reserved.
        </div>
      </footer>
    </div>
  )
}
