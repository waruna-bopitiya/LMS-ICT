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
  const [step, setStep] = useState<'phone' | 'otp'>('phone')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to send OTP')
        return
      }

      setStep('otp')
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

      // Redirect to student dashboard
      router.push('/student/dashboard')
    } catch (err) {
      setError('An error occurred. Please try again.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-secondary/20 p-4">
      <Card className="w-full max-w-md border-border">
        <CardHeader className="space-y-2">
          <CardTitle className="text-3xl font-bold text-primary">LMS Platform</CardTitle>
          <CardDescription className="text-base">
            {step === 'phone' ? 'Enter your phone number to get started' : 'Enter the OTP sent to your phone'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === 'phone' ? (
            <form onSubmit={handleSendOTP} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="phone" className="text-sm font-medium text-foreground">
                  Phone Number
                </label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+1 (555) 000-0000"
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
                {loading ? 'Sending...' : 'Send OTP'}
              </Button>
            </form>
          ) : (
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
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setStep('phone')
                    setOtp('')
                    setError('')
                  }}
                  className="flex-1"
                >
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
