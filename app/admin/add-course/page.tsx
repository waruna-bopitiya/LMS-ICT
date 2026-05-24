'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'

export default function AddCoursePage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [courseData, setCourseData] = useState({
    title: '',
    description: '',
    price: '',
  })

  const [videos, setVideos] = useState<
    Array<{ title: string; youtubeUrl: string; duration: string }>
  >([{ title: '', youtubeUrl: '', duration: '' }])

  const handleCourseChange = (field: string, value: string) => {
    setCourseData(prev => ({ ...prev, [field]: value }))
  }

  const handleVideoChange = (index: number, field: string, value: string) => {
    const newVideos = [...videos]
    newVideos[index] = { ...newVideos[index], [field]: value }
    setVideos(newVideos)
  }

  const addVideoField = () => {
    setVideos([...videos, { title: '', youtubeUrl: '', duration: '' }])
  }

  const removeVideoField = (index: number) => {
    setVideos(videos.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      // Create course
      const { data: courseRes, error: courseError } = await supabase
        .from('courses')
        .insert({
          title: courseData.title,
          description: courseData.description,
          price: parseFloat(courseData.price),
          created_by: user.id,
        })
        .select()
        .single()

      if (courseError) throw courseError

      // Create videos
      const videoInserts = videos
        .filter(v => v.title && v.youtubeUrl)
        .map((v, index) => ({
          course_id: courseRes.id,
          title: v.title,
          youtube_url: v.youtubeUrl,
          duration_seconds: parseInt(v.duration) || 0,
          sequence_order: index,
        }))

      if (videoInserts.length > 0) {
        const { error: videoError } = await supabase
          .from('videos')
          .insert(videoInserts)

        if (videoError) throw videoError
      }

      router.push('/admin/courses')
    } catch (err) {
      console.error('Error creating course:', err)
      setError('Failed to create course. Please try again.')
    } finally {
      setLoading(false)
    }
  }

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

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Link href="/admin/courses" className="text-primary hover:text-primary/80 transition mb-4 inline-block">
            ← Back to Courses
          </Link>
          <h1 className="text-4xl font-bold text-foreground mb-2">Create New Course</h1>
          <p className="text-muted-foreground">Add course details and YouTube videos</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Course Details */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Course Details</CardTitle>
              <CardDescription>Basic information about your course</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="title" className="text-sm font-medium text-foreground">
                  Course Title *
                </label>
                <Input
                  id="title"
                  value={courseData.title}
                  onChange={e => handleCourseChange('title', e.target.value)}
                  required
                  placeholder="e.g., Advanced JavaScript"
                  className="bg-secondary/10 border-border text-foreground"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="description" className="text-sm font-medium text-foreground">
                  Description
                </label>
                <textarea
                  id="description"
                  value={courseData.description}
                  onChange={e => handleCourseChange('description', e.target.value)}
                  placeholder="Course description..."
                  rows={4}
                  className="w-full px-3 py-2 bg-secondary/10 border border-border rounded-md text-foreground placeholder:text-muted-foreground"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="price" className="text-sm font-medium text-foreground">
                  Price ($) *
                </label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={courseData.price}
                  onChange={e => handleCourseChange('price', e.target.value)}
                  required
                  placeholder="99.99"
                  className="bg-secondary/10 border-border text-foreground"
                />
              </div>
            </CardContent>
          </Card>

          {/* Videos */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Course Videos</CardTitle>
              <CardDescription>Add YouTube videos to your course</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {videos.map((video, index) => (
                <div key={index} className="space-y-3 p-4 bg-secondary/10 rounded-lg border border-border">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-semibold text-foreground">Video {index + 1}</h4>
                    {videos.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeVideoField(index)}
                        className="text-destructive hover:text-destructive/80 text-sm"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label htmlFor={`title-${index}`} className="text-sm font-medium text-foreground">
                      Video Title
                    </label>
                    <Input
                      id={`title-${index}`}
                      value={video.title}
                      onChange={e => handleVideoChange(index, 'title', e.target.value)}
                      placeholder="Video title"
                      className="bg-background border-border text-foreground"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor={`url-${index}`} className="text-sm font-medium text-foreground">
                      YouTube URL
                    </label>
                    <Input
                      id={`url-${index}`}
                      value={video.youtubeUrl}
                      onChange={e => handleVideoChange(index, 'youtubeUrl', e.target.value)}
                      placeholder="https://www.youtube.com/watch?v=..."
                      className="bg-background border-border text-foreground"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor={`duration-${index}`} className="text-sm font-medium text-foreground">
                      Duration (seconds)
                    </label>
                    <Input
                      id={`duration-${index}`}
                      type="number"
                      value={video.duration}
                      onChange={e => handleVideoChange(index, 'duration', e.target.value)}
                      placeholder="300"
                      className="bg-background border-border text-foreground"
                    />
                  </div>
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                onClick={addVideoField}
                className="w-full border-border text-primary hover:bg-primary/10"
              >
                + Add Another Video
              </Button>
            </CardContent>
          </Card>

          {error && (
            <div className="p-4 bg-destructive/20 text-destructive rounded-md">
              {error}
            </div>
          )}

          {/* Submit */}
          <div className="flex gap-4">
            <Link href="/admin/courses" className="flex-1">
              <Button type="button" variant="outline" className="w-full border-border">
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {loading ? 'Creating...' : 'Create Course'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
