'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { parseCourseDescription, formatCourseDescription } from '@/lib/utils'
import { Image as ImageIcon, Upload } from 'lucide-react'

type Course = {
  id: string
  title: string
  description: string | null
  price: number
}

type Video = {
  id: string
  title: string
  youtube_url: string
  duration_seconds: number
}

type Material = {
  id: string
  title: string
  file_url: string
}

type Assignment = {
  id: string
  title: string
  instructions: string | null
  due_at: string | null
  assignment_submissions?: Array<{
    id: string
    answer_text: string | null
    file_url: string | null
    submitted_at: string
    users: { full_name: string | null; phone_number: string | null } | null
  }>
}

export default function AdminCourseManager({
  course,
  videos,
  materials,
  assignments,
}: {
  course: Course
  videos: Video[]
  materials: Material[]
  assignments: Assignment[]
}) {
  const router = useRouter()
  const supabase = createClient()
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const parsedDesc = parseCourseDescription(course.description)
  const [courseForm, setCourseForm] = useState({
    title: course.title,
    description: parsedDesc.description,
    price: String(course.price),
    imageUrl: parsedDesc.imageUrl || '',
  })
  const [videoForm, setVideoForm] = useState({
    title: '',
    url: '',
    duration: '',
    thumbnailUrl: '',
  })
  const [materialForm, setMaterialForm] = useState({
    title: '',
    url: '',
  })
  const [assignmentForm, setAssignmentForm] = useState({
    title: '',
    instructions: '',
    dueAt: '',
  })
  const [manualPhone, setManualPhone] = useState('')

  const uploadFile = async (file: File, type: string) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('courseId', course.id)
    formData.append('type', type)

    setUploading(true)
    try {
      const response = await fetch('/api/admin/uploads', {
        method: 'POST',
        body: formData,
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Upload failed')
      return data.url as string
    } finally {
      setUploading(false)
    }
  }

  const saveCourse = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const combinedDescription = formatCourseDescription(courseForm.description, courseForm.imageUrl || null)
      const { error } = await supabase
        .from('courses')
        .update({
          title: courseForm.title,
          description: combinedDescription || null,
          price: Number(courseForm.price),
        })
        .eq('id', course.id)
      if (error) throw error
      router.refresh()
    } catch (error) {
      console.error(error)
      alert('Failed to save class')
    } finally {
      setSaving(false)
    }
  }

  const addVideo = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const combinedTitle = formatVideoTitle(videoForm.title, videoForm.thumbnailUrl || null)
      const { error } = await supabase.from('videos').insert({
        course_id: course.id,
        title: combinedTitle,
        youtube_url: videoForm.url,
        duration_seconds: Number(videoForm.duration) || 0,
        sequence_order: videos.length,
      })
      if (error) throw error
      setVideoForm({ title: '', url: '', duration: '', thumbnailUrl: '' })
      router.refresh()
    } catch (error) {
      console.error(error)
      alert('Failed to add video')
    } finally {
      setSaving(false)
    }
  }

  const addMaterial = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const { error } = await supabase.from('course_materials').insert({
        course_id: course.id,
        title: materialForm.title,
        file_url: materialForm.url,
        sequence_order: materials.length,
      })
      if (error) throw error
      setMaterialForm({ title: '', url: '' })
      router.refresh()
    } catch (error) {
      console.error(error)
      alert('Failed to add PDF')
    } finally {
      setSaving(false)
    }
  }

  const addAssignment = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const { error } = await supabase.from('assignments').insert({
        course_id: course.id,
        title: assignmentForm.title,
        instructions: assignmentForm.instructions || null,
        due_at: assignmentForm.dueAt ? new Date(assignmentForm.dueAt).toISOString() : null,
      })
      if (error) throw error
      setAssignmentForm({ title: '', instructions: '', dueAt: '' })
      router.refresh()
    } catch (error) {
      console.error(error)
      alert('Failed to create submission')
    } finally {
      setSaving(false)
    }
  }

  const activateStudent = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const response = await fetch('/api/admin/manual-enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: manualPhone,
          courseId: course.id,
        }),
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to activate student')
      }

      setManualPhone('')
      alert('Student activated for this class')
      router.refresh()
    } catch (error) {
      console.error(error)
      alert(error instanceof Error ? error.message : 'Failed to activate student')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-8">
      <Card className="border-border">
        <CardHeader>
          <CardTitle>Class Details</CardTitle>
          <CardDescription>Class name, description, and payment amount</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={saveCourse} className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Class Title</label>
              <Input
                value={courseForm.title}
                onChange={e => setCourseForm(prev => ({ ...prev, title: e.target.value }))}
                required
                placeholder="Class title"
                className="bg-secondary/10 border-border text-foreground"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Payment Amount (LKR)</label>
              <Input
                type="number"
                step="0.01"
                value={courseForm.price}
                onChange={e => setCourseForm(prev => ({ ...prev, price: e.target.value }))}
                required
                placeholder="Payment amount"
                className="bg-secondary/10 border-border text-foreground"
              />
            </div>

            {/* Course Cover Photo Uploader */}
            <div className="sm:col-span-2 grid sm:grid-cols-[150px_1fr] gap-4 items-center border border-border/60 p-4 rounded-xl bg-secondary/5">
              <div className="relative h-[100px] w-full sm:w-[150px] rounded-lg border border-border/80 bg-secondary/20 flex items-center justify-center overflow-hidden">
                {courseForm.imageUrl ? (
                  <img
                    src={courseForm.imageUrl}
                    alt="Course cover preview"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="text-center text-muted-foreground">
                    <ImageIcon className="h-8 w-8 mx-auto opacity-40 mb-1" />
                    <span className="text-[10px] uppercase font-bold tracking-wider">No Photo</span>
                  </div>
                )}
              </div>
              <div className="space-y-3 w-full">
                <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Upload className="h-3.5 w-3.5 text-primary" />
                  Course Cover Photo
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1 relative">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={async e => {
                        const file = e.target.files?.[0]
                        if (!file) return
                        try {
                          const url = await uploadFile(file, 'course-image')
                          setCourseForm(prev => ({ ...prev, imageUrl: url }))
                        } catch (err) {
                          alert(err instanceof Error ? err.message : 'Upload failed')
                        }
                      }}
                      className="bg-secondary/10 border-border text-foreground cursor-pointer"
                    />
                    {uploading && (
                      <span className="absolute right-3 top-2 text-xs font-semibold text-primary animate-pulse">Uploading...</span>
                    )}
                  </div>
                  <Input
                    type="text"
                    value={courseForm.imageUrl}
                    onChange={e => setCourseForm(prev => ({ ...prev, imageUrl: e.target.value }))}
                    placeholder="Or paste image URL directly..."
                    className="bg-secondary/10 border-border text-foreground flex-1"
                  />
                </div>
              </div>
            </div>

            <div className="sm:col-span-2 space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Class Description</label>
              <Textarea
                value={courseForm.description}
                onChange={e => setCourseForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Class description"
                className="bg-secondary/10 border-border text-foreground h-28"
              />
            </div>
            <Button disabled={saving || uploading} className="sm:col-span-2 bg-primary hover:bg-primary/95 text-primary-foreground font-semibold h-11 rounded-xl">
              {saving ? 'Saving...' : 'Save Class Details'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-border">
        <CardHeader>
          <CardTitle>Manual Student Activation</CardTitle>
          <CardDescription>Mark a registered student as paid and active without a bank slip</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={activateStudent} className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <Input
              type="tel"
              value={manualPhone}
              onChange={e => setManualPhone(e.target.value)}
              required
              placeholder="Student phone number"
              className="bg-secondary/10 border-border text-foreground"
            />
            <Button
              disabled={saving || !manualPhone}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {saving ? 'Activating...' : 'Activate as Paid'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-8 lg:grid-cols-2">
        <Card className="border-border">
          <CardHeader>
            <CardTitle>Videos</CardTitle>
            <CardDescription>Upload video files for stronger protection, or paste an embeddable video link</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <form onSubmit={addVideo} className="space-y-3">
              <Input
                value={videoForm.title}
                onChange={e => setVideoForm(prev => ({ ...prev, title: e.target.value }))}
                required
                placeholder="Video title"
                className="bg-secondary/10 border-border text-foreground"
              />
              <Input
                value={videoForm.url}
                onChange={e => setVideoForm(prev => ({ ...prev, url: e.target.value }))}
                required
                placeholder="Video URL or uploaded file URL"
                className="bg-secondary/10 border-border text-foreground"
              />

              {/* Video cover thumbnail uploader */}
              <div className="grid sm:grid-cols-[1fr_auto] gap-2 items-center border border-border/40 p-3 rounded-lg bg-secondary/5">
                <div className="space-y-2 flex-1">
                  <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">Video Thumbnail Image</span>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={async e => {
                          const file = e.target.files?.[0]
                          if (!file) return
                          try {
                            const url = await uploadFile(file, 'video-thumbnail')
                            setVideoForm(prev => ({ ...prev, thumbnailUrl: url }))
                          } catch (err) {
                            alert(err instanceof Error ? err.message : 'Upload failed')
                          }
                        }}
                        className="bg-secondary/10 border-border text-foreground cursor-pointer h-9 text-xs"
                      />
                    </div>
                    <Input
                      type="text"
                      value={videoForm.thumbnailUrl}
                      onChange={e => setVideoForm(prev => ({ ...prev, thumbnailUrl: e.target.value }))}
                      placeholder="Paste thumbnail URL..."
                      className="bg-secondary/10 border-border text-foreground flex-1 h-9 text-xs"
                    />
                  </div>
                </div>
                {videoForm.thumbnailUrl && (
                  <div className="w-14 h-9 rounded overflow-hidden border border-border shrink-0 self-end">
                    <img src={videoForm.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                <Input
                  type="number"
                  value={videoForm.duration}
                  onChange={e => setVideoForm(prev => ({ ...prev, duration: e.target.value }))}
                  placeholder="Duration seconds"
                  className="bg-secondary/10 border-border text-foreground"
                />
                <Input
                  type="file"
                  accept="video/*"
                  onChange={async e => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    const url = await uploadFile(file, 'videos')
                    setVideoForm(prev => ({ ...prev, url }))
                  }}
                  className="bg-secondary/10 border-border text-foreground"
                />
              </div>
              <Button disabled={saving || uploading} className="w-full bg-primary hover:bg-primary/95 text-primary-foreground font-semibold h-11 rounded-xl">
                {uploading ? 'Uploading...' : 'Add Video'}
              </Button>
            </form>

            <div className="space-y-2">
              {videos.map(video => {
                const { title: cleanVideoTitle, thumbnailUrl } = parseVideoTitle(video.title)
                return (
                  <div key={video.id} className="flex items-center justify-between rounded-md border border-border p-3 bg-secondary/5 hover:border-primary/20 transition-all">
                    <div className="flex items-center gap-3">
                      {thumbnailUrl && (
                        <div className="w-10 h-7 rounded overflow-hidden border border-border/40 shrink-0">
                          <img src={thumbnailUrl} alt="" className="w-full h-full object-cover" />
                        </div>
                      )}
                      <span className="text-sm font-semibold text-foreground">{cleanVideoTitle}</span>
                    </div>
                    <Badge variant="secondary" className="font-semibold">{video.duration_seconds ? `${Math.round(video.duration_seconds / 60)}m` : 'Video'}</Badge>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader>
            <CardTitle>PDFs</CardTitle>
            <CardDescription>Upload notes or paste a PDF link</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <form onSubmit={addMaterial} className="space-y-3">
              <Input
                value={materialForm.title}
                onChange={e => setMaterialForm(prev => ({ ...prev, title: e.target.value }))}
                required
                placeholder="PDF title"
                className="bg-secondary/10 border-border text-foreground"
              />
              <Input
                value={materialForm.url}
                onChange={e => setMaterialForm(prev => ({ ...prev, url: e.target.value }))}
                required
                placeholder="PDF URL or uploaded file URL"
                className="bg-secondary/10 border-border text-foreground"
              />
              <Input
                type="file"
                accept="application/pdf"
                onChange={async e => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  const url = await uploadFile(file, 'pdfs')
                  setMaterialForm(prev => ({ ...prev, url }))
                }}
                className="bg-secondary/10 border-border text-foreground"
              />
              <Button disabled={saving || uploading} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                {uploading ? 'Uploading...' : 'Add PDF'}
              </Button>
            </form>

            <div className="space-y-2">
              {materials.map(material => (
                <a key={material.id} href={material.file_url} target="_blank" rel="noreferrer" className="block rounded-md border border-border p-3 text-sm text-foreground hover:bg-secondary/10">
                  {material.title}
                </a>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border">
        <CardHeader>
          <CardTitle>Submissions</CardTitle>
          <CardDescription>Create work for students and review their answers</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={addAssignment} className="grid gap-3 md:grid-cols-2">
            <Input
              value={assignmentForm.title}
              onChange={e => setAssignmentForm(prev => ({ ...prev, title: e.target.value }))}
              required
              placeholder="Submission title"
              className="bg-secondary/10 border-border text-foreground"
            />
            <Input
              type="datetime-local"
              value={assignmentForm.dueAt}
              onChange={e => setAssignmentForm(prev => ({ ...prev, dueAt: e.target.value }))}
              className="bg-secondary/10 border-border text-foreground"
            />
            <Textarea
              value={assignmentForm.instructions}
              onChange={e => setAssignmentForm(prev => ({ ...prev, instructions: e.target.value }))}
              placeholder="Instructions"
              className="md:col-span-2 bg-secondary/10 border-border text-foreground"
            />
            <Button disabled={saving} className="md:col-span-2 bg-primary hover:bg-primary/90 text-primary-foreground">
              Create Submission
            </Button>
          </form>

          <div className="space-y-4">
            {assignments.map(assignment => (
              <div key={assignment.id} className="rounded-md border border-border p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-foreground">{assignment.title}</h3>
                    {assignment.instructions && (
                      <p className="mt-1 text-sm text-muted-foreground">{assignment.instructions}</p>
                    )}
                  </div>
                  <Badge variant="outline">{assignment.assignment_submissions?.length || 0} submitted</Badge>
                </div>
                <div className="mt-4 space-y-3">
                  {assignment.assignment_submissions?.map(submission => (
                    <div key={submission.id} className="rounded-md bg-secondary/10 p-3 text-sm">
                      <div className="font-medium text-foreground">
                        {submission.users?.full_name || 'Student'} ({submission.users?.phone_number || 'No phone'})
                      </div>
                      {submission.answer_text && <p className="mt-1 text-muted-foreground">{submission.answer_text}</p>}
                      {submission.file_url && (
                        <a href={submission.file_url} target="_blank" rel="noreferrer" className="mt-2 inline-block text-primary">
                          Open submitted file
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
