'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Laptop, ChevronLeft, ShieldCheck, PlayCircle, FileText, CheckCircle2 } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [password, setPassword] = useState('')
  const [step, setStep] = useState<'phone' | 'otp' | 'password' | 'reset-password'>('phone')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [failedAttempts, setFailedAttempts] = useState(0)
  const [isResettingPassword, setIsResettingPassword] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')

  const sendOtp = async (phoneToSend?: string) => {
    const activePhone = phoneToSend || phone
    const response = await fetch('/api/auth/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: activePhone }),
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

      if (data.phone) {
        setPhone(data.phone)
      }

      if (data.canLoginWithPassword) {
        setStep('password')
      } else {
        await sendOtp(data.phone)
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
        const nextAttempts = failedAttempts + 1
        setFailedAttempts(nextAttempts)
        
        if (nextAttempts >= 3) {
          setError('Too many failed password attempts. Sending OTP to reset your password...')
          try {
            await sendOtp()
            setIsResettingPassword(true)
            setFailedAttempts(0)
          } catch (otpErr: any) {
            setError(otpErr.message || 'Failed to send OTP')
          }
        } else {
          setError(`${data.error || 'Invalid phone number or password'}. Attempts left: ${3 - nextAttempts}`)
        }
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

      if (isResettingPassword) {
        setStep('reset-password')
      } else {
        await redirectAfterLogin()
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword !== confirmNewPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: newPassword }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to reset password')
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
    setFailedAttempts(0)
    setIsResettingPassword(false)
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background relative overflow-hidden">
      
      {/* Background decoration */}
      <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none" />

      {/* Left side Billboard Panel (Hidden on mobile) */}
      <div className="hidden lg:flex flex-col justify-between p-12 bg-gradient-to-br from-indigo-950 via-slate-900 to-background border-r border-border relative overflow-hidden">
        {/* Glow orb */}
        <div className="absolute top-1/4 -left-20 h-[350px] w-[350px] rounded-full bg-primary/10 blur-[80px] pointer-events-none" />
        
        {/* Logo Header */}
        <Link href="/" className="flex items-center gap-3 self-start group z-10">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-indigo-600 text-primary-foreground shadow-md transition-transform group-hover:scale-105">
            <Laptop className="h-6 w-6" />
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-bold tracking-tight text-white group-hover:text-primary transition-colors">
              I See ICT
            </span>
            <span className="text-xs text-muted-foreground/85 font-medium -mt-1">
              by Waruna Bopitiya
            </span>
          </div>
        </Link>

        {/* Feature List Billboard */}
        <div className="max-w-md my-auto space-y-8 z-10">
          <div className="space-y-4">
            <span className="text-primary text-xs font-bold uppercase tracking-widest bg-primary/10 border border-primary/20 px-3.5 py-1 rounded-full">
              LMS PORTAL
            </span>
            <h2 className="text-4xl font-bold text-white leading-tight">
              Access the Complete Learning Suite
            </h2>
            <p className="text-slate-300 text-sm leading-relaxed">
              Log in to your account using your verified phone number to instantly view your active courses, watch lecture videos, download notes, and submit homework.
            </p>
          </div>

          <div className="space-y-5 pt-4">
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 shrink-0 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-primary">
                <PlayCircle className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-bold text-white text-sm">Secure Lesson Player</h4>
                <p className="text-slate-400 text-xs mt-0.5">High-speed lag-free playback with automatic course watch progress tracking.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="h-10 w-10 shrink-0 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-primary">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-bold text-white text-sm">PDF Notes & Sheets</h4>
                <p className="text-slate-400 text-xs mt-0.5">Curated lesson guides, summaries, and A/L paper materials for download.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="h-10 w-10 shrink-0 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-primary">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-bold text-white text-sm">Assignments & Feedback</h4>
                <p className="text-slate-400 text-xs mt-0.5">Direct online submissions evaluated by our expert support panel.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="text-xs text-slate-400 z-10 flex items-center gap-1">
          <ShieldCheck className="h-4 w-4 text-primary" />
          <span>Secured by SSL Encryption and OTP Authentication</span>
        </div>
      </div>

      {/* Right side Form Panel */}
      <div className="flex flex-col items-center justify-center p-6 sm:p-10">
        
        {/* Back Link */}
        <Link href="/" className="absolute top-6 left-6 inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-primary transition-colors">
          <ChevronLeft className="h-4 w-4" /> Back to Home
        </Link>

        {/* Brand Display on Mobile */}
        <div className="flex items-center gap-2 mb-8 lg:hidden">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Laptop className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold tracking-tight text-foreground">
              I See ICT
            </span>
            <span className="text-[9px] text-muted-foreground font-medium -mt-1">
              by Waruna Bopitiya
            </span>
          </div>
        </div>

        <Card className="w-full max-w-md border-border glass-panel rounded-2xl shadow-lg relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary to-indigo-600" />
          <CardHeader className="space-y-2 pt-8">
            <CardTitle className="text-2xl sm:text-3xl font-bold text-foreground">Student Portal</CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              {step === 'phone'
                ? 'Enter your phone number to continue'
                : step === 'password'
                  ? 'Enter your password to sign in'
                  : step === 'reset-password'
                    ? 'Enter a new password for your account'
                    : 'Enter the verification code sent via SMS'}
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-8">
            
            {step === 'phone' && (
              <form onSubmit={handlePhoneSubmit} className="space-y-5">
                <div className="space-y-2">
                  <label htmlFor="phone" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Phone Number
                  </label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="07XXXXXXXX"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    className="bg-secondary/20 border-border text-foreground placeholder:text-muted-foreground h-11 rounded-xl focus-visible:ring-primary focus-visible:border-primary"
                  />
                </div>

                {error && (
                  <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-xl text-xs font-semibold">
                    ⚠ {error}
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={loading || !phone}
                  className="w-full bg-primary hover:bg-primary/95 text-primary-foreground font-semibold h-11 rounded-xl"
                >
                  {loading ? 'Checking account...' : 'Continue'}
                </Button>
              </form>
            )}

            {step === 'password' && (
              <form onSubmit={handlePasswordLogin} className="space-y-5">
                <div className="space-y-2">
                  <label htmlFor="phone-display" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Phone Number
                  </label>
                  <Input
                    id="phone-display"
                    type="tel"
                    name="username"
                    value={phone}
                    readOnly
                    autoComplete="username"
                    className="bg-secondary/10 border-border text-muted-foreground h-11 rounded-xl cursor-not-allowed"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="password" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Password
                  </label>
                  <Input
                    id="password"
                    type="password"
                    name="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    className="bg-secondary/20 border-border text-foreground h-11 rounded-xl focus-visible:ring-primary focus-visible:border-primary"
                  />
                </div>

                {error && (
                  <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-xl text-xs font-semibold">
                    ⚠ {error}
                  </div>
                )}

                <div className="flex gap-3">
                  <Button type="button" variant="outline" onClick={goBackToPhone} className="flex-1 h-11 rounded-xl border-border text-foreground">
                    Back
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading || !password}
                    className="flex-1 bg-primary hover:bg-primary/95 text-primary-foreground font-semibold h-11 rounded-xl"
                  >
                    {loading ? 'Signing in...' : 'Sign In'}
                  </Button>
                </div>
              </form>
            )}

            {step === 'otp' && (
              <form onSubmit={handleVerifyOTP} className="space-y-5">
                <div className="space-y-2">
                  <label htmlFor="otp" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    SMS Verification Code
                  </label>
                  <Input
                    id="otp"
                    type="text"
                    placeholder="000000"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    required
                    maxLength={6}
                    className="bg-secondary/20 border-border text-foreground placeholder:text-muted-foreground text-center text-2xl font-bold tracking-widest h-14 rounded-xl focus-visible:ring-primary focus-visible:border-primary"
                  />
                </div>

                {error && (
                  <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-xl text-xs font-semibold">
                    ⚠ {error}
                  </div>
                )}

                <div className="flex gap-3">
                  <Button type="button" variant="outline" onClick={goBackToPhone} className="flex-1 h-11 rounded-xl border-border text-foreground">
                    Back
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading || otp.length !== 6}
                    className="flex-1 bg-primary hover:bg-primary/95 text-primary-foreground font-semibold h-11 rounded-xl"
                  >
                    {loading ? 'Verifying OTP...' : 'Verify & Log In'}
                  </Button>
                </div>
              </form>
            )}

            {step === 'reset-password' && (
              <form onSubmit={handleResetPasswordSubmit} className="space-y-5">
                <input
                  type="text"
                  name="username"
                  value={phone}
                  readOnly
                  autoComplete="username"
                  className="hidden"
                />

                <div className="space-y-2">
                  <label htmlFor="newPassword" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    New Password
                  </label>
                  <Input
                    id="newPassword"
                    type="password"
                    name="new-password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={6}
                    autoComplete="new-password"
                    className="border-border text-foreground h-10 rounded-md focus-visible:ring-1 focus-visible:ring-zinc-400 focus-visible:border-zinc-400"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="confirmNewPassword" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Confirm New Password
                  </label>
                  <Input
                    id="confirmNewPassword"
                    type="password"
                    name="confirm-password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    required
                    minLength={6}
                    autoComplete="new-password"
                    className="border-border text-foreground h-10 rounded-md focus-visible:ring-1 focus-visible:ring-zinc-400 focus-visible:border-zinc-400"
                  />
                </div>

                {error && (
                  <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-md text-xs font-medium">
                    ⚠ {error}
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={loading || !newPassword || !confirmNewPassword}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold h-10 rounded-md"
                >
                  {loading ? 'Resetting password...' : 'Reset Password & Log In'}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>

    </div>
  )
}
