'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

export default function CourseAdminActions({ id, title, published }: { id: string; title: string; published: boolean }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const send = async (method: 'PATCH' | 'DELETE', body?: object) => {
    setBusy(true); setError('')
    const res = await fetch(`/api/admin/courses/${id}`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    })
    const data = await res.json().catch(() => ({}))
    setBusy(false)
    if (!res.ok) { setError(data.error || 'Something went wrong'); return }
    router.refresh()
  }

  const remove = () => {
    if (confirm(`Delete "${title}" permanently? Its videos, materials and assignments are deleted too.`)) send('DELETE')
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className={`text-xs font-semibold uppercase tracking-wider ${published ? 'text-green-600' : 'text-muted-foreground'}`}>
        {published ? 'Published' : 'Hidden'}
      </span>
      <Button variant="outline" disabled={busy} className="rounded-xl h-9" onClick={() => send('PATCH', { is_published: !published })}>
        {published ? 'Unpublish' : 'Publish'}
      </Button>
      <Button variant="outline" disabled={busy} className="rounded-xl h-9 text-red-600 border-red-300 hover:bg-red-50" onClick={remove}>
        Delete
      </Button>
      {error && <p className="w-full text-xs text-red-600">{error}</p>}
    </div>
  )
}
