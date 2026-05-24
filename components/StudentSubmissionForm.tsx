'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

export default function StudentSubmissionForm({
  assignmentId,
  submitted,
}: {
  assignmentId: string
  submitted: boolean
}) {
  const router = useRouter()
  const [answerText, setAnswerText] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('assignmentId', assignmentId)
      formData.append('answerText', answerText)
      if (file) formData.append('file', file)

      const response = await fetch('/api/student/submissions', {
        method: 'POST',
        body: formData,
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Submit failed')

      setAnswerText('')
      setFile(null)
      router.refresh()
    } catch (error) {
      console.error(error)
      alert('Failed to submit')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-3">
      <Textarea
        value={answerText}
        onChange={e => setAnswerText(e.target.value)}
        placeholder="Write your answer"
        className="bg-secondary/10 border-border text-foreground"
      />
      <Input
        type="file"
        onChange={e => setFile(e.target.files?.[0] || null)}
        className="bg-secondary/10 border-border text-foreground"
      />
      <Button
        disabled={loading || (!answerText && !file)}
        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
      >
        {loading ? 'Submitting...' : submitted ? 'Update Submission' : 'Submit'}
      </Button>
    </form>
  )
}
