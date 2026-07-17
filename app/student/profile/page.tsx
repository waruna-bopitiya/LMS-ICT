'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function StudentProfilePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState('')
  const [isExistingUser, setIsExistingUser] = useState(false)
  const [studentId, setStudentId] = useState<number | null>(null)
  const [phone, setPhone] = useState('')
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    school: '',
    district: '',
    guardianPhone: '',
    password: '',
    confirmPassword: '',
  })

  useEffect(() => {
    async function loadProfile() {
      try {
        const response = await fetch('/api/student/profile')
        if (response.ok) {
          const data = await response.json()
          if (data.profile) {
            setForm({
              fullName: data.profile.full_name || '',
              email: data.profile.email || '',
              school: data.profile.school || '',
              district: data.profile.district || '',
              guardianPhone: data.profile.guardian_phone || '',
              password: '',
              confirmPassword: '',
            })
            if (data.profile.full_name && data.profile.district) {
              router.push('/student/dashboard')
              return
            }
            if (data.profile.student_id) {
              setStudentId(data.profile.student_id)
            }
            if (data.profile.phone_number) {
              setPhone(data.profile.phone_number)
            }
          }
        }
      } catch (err) {
        console.error('Failed to load profile:', err)
      } finally {
        setFetching(false)
      }
    }
    loadProfile()
  }, [])

  const updateField = (field: keyof typeof form, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Basic password validation
    if (!isExistingUser || form.password) {
      if (!form.password || form.password.length < 6) {
        setError('Password must be at least 6 characters')
        setLoading(false)
        return
      }
      if (form.password !== form.confirmPassword) {
        setError('Passwords do not match')
        setLoading(false)
        return
      }
    }

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

  if (fetching) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <p className="text-muted-foreground text-sm">Loading profile...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative">
      
      {isExistingUser && (
        <div className="w-full max-w-2xl mb-4 animate-in fade-in duration-300">
          <Link href="/student/dashboard" className="text-sm text-primary hover:underline flex items-center gap-1.5 font-semibold">
            <ArrowLeft className="h-4 w-4" /> Back to Dashboard
          </Link>
        </div>
      )}

      <Card className="w-full max-w-2xl border-border">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4">
            <div>
              <CardTitle className="text-3xl text-foreground">
                {isExistingUser ? 'Edit Profile' : 'Complete Your Details'}
              </CardTitle>
              <CardDescription className="mt-1.5">
                {isExistingUser 
                  ? 'Update your student information below.' 
                  : 'Add your student information before opening course content.'}
              </CardDescription>
            </div>
            {studentId && (
              <div className="shrink-0 bg-secondary/80 border border-border px-3 py-1.5 rounded-lg font-mono text-sm font-semibold text-foreground">
                Student ID: {studentId}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
            <input
              type="text"
              name="username"
              value={phone}
              readOnly
              autoComplete="username"
              className="hidden"
            />
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

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-foreground">
                {isExistingUser ? 'New Password (Optional)' : 'New Password *'}
              </label>
              <Input
                id="password"
                type="password"
                name="new-password"
                value={form.password}
                onChange={e => updateField('password', e.target.value)}
                required={!isExistingUser}
                placeholder={isExistingUser ? 'Leave blank to keep current' : ''}
                minLength={6}
                autoComplete="new-password"
                className="bg-secondary/10 border-border text-foreground"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">
                Confirm Password {!isExistingUser && '*'}
              </label>
              <Input
                id="confirmPassword"
                type="password"
                name="confirm-password"
                value={form.confirmPassword}
                onChange={e => updateField('confirmPassword', e.target.value)}
                required={!isExistingUser && !!form.password}
                placeholder={isExistingUser ? 'Leave blank to keep current' : ''}
                minLength={6}
                autoComplete="new-password"
                className="bg-secondary/10 border-border text-foreground"
              />
            </div>

            {error && (
              <div className="sm:col-span-2 p-3 bg-destructive/20 text-destructive rounded-md text-sm">
                {error}
              </div>
            )}

            <div className="sm:col-span-2 mt-2">
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
              >
                {loading ? 'Saving...' : isExistingUser ? 'Save Profile' : 'Continue'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
