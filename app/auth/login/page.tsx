'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function LoginPage() {
  const router = useRouter()
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [password, setPassword] = useState('')
  const [step, setStep] = useState<'phone' | 'otp' | 'password'>('phone')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const sendOtp = async () => {
    const response = await fetch('/api/auth/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone }),
    })
    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Failed to send OTP')
    }

    setStep('otp')
  }

  const redirectAfterLogin = async () => {
    const response = await fetch('/api/auth/session-target')
    const data = await response.json()
    router.push(data.target || '/student/dashboard')
    router.refresh()
  }

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/check-phone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      })
      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to check phone number')
        return
      }

      if (data.canLoginWithPassword) {
        setStep('password')
      } else {
        await sendOtp()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred. Please try again.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/password-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password }),
      })
      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Invalid phone number or password')
        return
      }

      await redirectAfterLogin()
    } catch (err) {
      setError('An error occurred. Please try again.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, token: otp }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to verify OTP')
        return
      }

      await redirectAfterLogin()
    } catch (err) {
      setError('An error occurred. Please try again.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const goBackToPhone = () => {
    setStep('phone')
    setOtp('')
    setPassword('')
    setError('')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-secondary/20 p-4">
      <Card className="w-full max-w-md border-border">
        <CardHeader className="space-y-2">
          <CardTitle className="text-3xl font-bold text-primary">LMS Platform</CardTitle>
          <CardDescription className="text-base">
            {step === 'phone'
              ? 'Enter your phone number to get started'
              : step === 'password'
                ? 'Enter your password to continue'
                : 'Enter the OTP sent to your phone'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === 'phone' && (
            <form onSubmit={handlePhoneSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="phone" className="text-sm font-medium text-foreground">
                  Phone Number
                </label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="07XXXXXXXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  className="bg-secondary/10 border-border text-foreground placeholder:text-muted-foreground"
                />
              </div>

              {error && (
                <div className="p-3 bg-destructive/20 text-destructive rounded-md text-sm">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                disabled={loading || !phone}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {loading ? 'Checking...' : 'Continue'}
              </Button>
            </form>
          )}

          {step === 'password' && (
            <form onSubmit={handlePasswordLogin} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-foreground">
                  Password
                </label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-secondary/10 border-border text-foreground placeholder:text-muted-foreground"
                />
              </div>

              {error && (
                <div className="p-3 bg-destructive/20 text-destructive rounded-md text-sm">
                  {error}
                </div>
              )}

              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={goBackToPhone} className="flex-1">
                  Back
                </Button>
                <Button
                  type="submit"
                  disabled={loading || !password}
                  className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  {loading ? 'Logging in...' : 'Login'}
                </Button>
              </div>
            </form>
          )}

          {step === 'otp' && (
            <form onSubmit={handleVerifyOTP} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="otp" className="text-sm font-medium text-foreground">
                  One-Time Password
                </label>
                <Input
                  id="otp"
                  type="text"
                  placeholder="000000"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  required
                  maxLength={6}
                  className="bg-secondary/10 border-border text-foreground placeholder:text-muted-foreground text-center text-2xl tracking-widest"
                />
              </div>

              {error && (
                <div className="p-3 bg-destructive/20 text-destructive rounded-md text-sm">
                  {error}
                </div>
              )}

              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={goBackToPhone} className="flex-1">
                  Back
                </Button>
                <Button
                  type="submit"
                  disabled={loading || otp.length !== 6}
                  className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  {loading ? 'Verifying...' : 'Verify'}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
