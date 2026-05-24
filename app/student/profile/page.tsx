'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

export default function StudentProfilePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    school: '',
    district: '',
    guardianPhone: '',
    password: '',
    confirmPassword: '',
  })

  const updateField = (field: keyof typeof form, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/student/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to save details')
        return
      }

      router.push('/student/dashboard')
      router.refresh()
    } catch (err) {
      console.error(err)
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl border-border">
        <CardHeader>
          <CardTitle className="text-3xl text-foreground">Complete Your Details</CardTitle>
          <CardDescription>
            Add your student information before opening course content.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <label htmlFor="fullName" className="text-sm font-medium text-foreground">
                Full Name *
              </label>
              <Input
                id="fullName"
                value={form.fullName}
                onChange={e => updateField('fullName', e.target.value)}
                required
                className="bg-secondary/10 border-border text-foreground"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="district" className="text-sm font-medium text-foreground">
                District *
              </label>
              <Input
                id="district"
                value={form.district}
                onChange={e => updateField('district', e.target.value)}
                required
                className="bg-secondary/10 border-border text-foreground"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-foreground">
                New Password *
              </label>
              <Input
                id="password"
                type="password"
                value={form.password}
                onChange={e => updateField('password', e.target.value)}
                required
                minLength={6}
                className="bg-secondary/10 border-border text-foreground"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">
                Confirm Password *
              </label>
              <Input
                id="confirmPassword"
                type="password"
                value={form.confirmPassword}
                onChange={e => updateField('confirmPassword', e.target.value)}
                required
                minLength={6}
                className="bg-secondary/10 border-border text-foreground"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="school" className="text-sm font-medium text-foreground">
                School
              </label>
              <Input
                id="school"
                value={form.school}
                onChange={e => updateField('school', e.target.value)}
                className="bg-secondary/10 border-border text-foreground"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-foreground">
                Email
              </label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={e => updateField('email', e.target.value)}
                className="bg-secondary/10 border-border text-foreground"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="guardianPhone" className="text-sm font-medium text-foreground">
                Parent / Guardian Phone
              </label>
              <Input
                id="guardianPhone"
                type="tel"
                value={form.guardianPhone}
                onChange={e => updateField('guardianPhone', e.target.value)}
                className="bg-secondary/10 border-border text-foreground"
              />
            </div>

            {error && (
              <div className="sm:col-span-2 p-3 bg-destructive/20 text-destructive rounded-md text-sm">
                {error}
              </div>
            )}

            <div className="sm:col-span-2">
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {loading ? 'Saving...' : 'Continue'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
