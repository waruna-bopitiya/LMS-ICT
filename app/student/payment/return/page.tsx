'use client'

import { useEffect, useState, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  CheckCircle2,
  Clock,
  XCircle,
  RefreshCw,
  ArrowRight,
  Landmark,
} from 'lucide-react'

type Status = {
  paymentStatus: 'pending' | 'approved' | 'rejected'
  enrollmentStatus: 'pending' | 'active' | null
  courseId: string
  courseTitle: string
  amount: number
  isBankTransfer: boolean
}

// PayHere's callback usually lands within a few seconds, but it is a separate
// server-to-server request and can lag. Poll rather than guess.
const POLL_INTERVAL_MS = 3000
const POLL_TIMEOUT_MS = 60000

function PaymentReturn() {
  const params = useSearchParams()
  const paymentId = params.get('payment')
  const cancelled = params.get('cancelled') === '1'

  const [status, setStatus] = useState<Status | null>(null)
  const [error, setError] = useState('')
  const [elapsed, setElapsed] = useState(0)

  const fetchStatus = useCallback(async () => {
    if (!paymentId) return null
    const response = await fetch(`/api/payments/status?payment=${paymentId}`)
    const data = await response.json()
    if (!response.ok) throw new Error(data.error || 'Could not check the payment')
    return data as Status
  }, [paymentId])

  useEffect(() => {
    if (!paymentId) {
      setError('No payment reference was provided.')
      return
    }

    let active = true
    let timer: ReturnType<typeof setTimeout>
    const startedAt = Date.now()

    const poll = async () => {
      try {
        const next = await fetchStatus()
        if (!active || !next) return

        setStatus(next)
        setElapsed(Date.now() - startedAt)

        const settled =
          next.enrollmentStatus === 'active' || next.paymentStatus === 'rejected'

        // Bank transfers settle when an admin reviews them, so there is nothing
        // to wait for here — show the "submitted" state straight away.
        if (settled || next.isBankTransfer) return

        if (Date.now() - startedAt < POLL_TIMEOUT_MS) {
          timer = setTimeout(poll, POLL_INTERVAL_MS)
        }
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : 'Something went wrong')
      }
    }

    void poll()

    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [paymentId, fetchStatus])

  const timedOut = elapsed >= POLL_TIMEOUT_MS

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-border glass-panel rounded-2xl shadow-lg overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary to-indigo-600" />
        <CardContent className="p-8 text-center space-y-5">
          {renderBody()}
        </CardContent>
      </Card>
    </div>
  )

  function renderBody() {
    if (error) {
      return (
        <>
          <XCircle className="h-14 w-14 text-destructive mx-auto" />
          <div className="space-y-1.5">
            <h1 className="text-2xl font-bold text-foreground">Something went wrong</h1>
            <p className="text-sm text-muted-foreground leading-relaxed">{error}</p>
          </div>
          <Link href="/student/dashboard" className="block">
            <Button className="w-full h-11 rounded-xl font-semibold">Go to dashboard</Button>
          </Link>
        </>
      )
    }

    if (!status) {
      return (
        <>
          <RefreshCw className="h-14 w-14 text-primary mx-auto animate-spin" />
          <div className="space-y-1.5">
            <h1 className="text-2xl font-bold text-foreground">Checking your payment</h1>
            <p className="text-sm text-muted-foreground">This only takes a moment.</p>
          </div>
        </>
      )
    }

    if (status.enrollmentStatus === 'active') {
      return (
        <>
          <CheckCircle2 className="h-14 w-14 text-emerald-500 mx-auto" />
          <div className="space-y-1.5">
            <h1 className="text-2xl font-bold text-foreground">Payment confirmed</h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              You now have full access to <strong className="text-foreground">{status.courseTitle}</strong>.
              Lesson videos, notes, and assignments are unlocked.
            </p>
          </div>
          <Link href={`/student/courses/${status.courseId}`} className="block">
            <Button className="w-full h-11 rounded-xl font-semibold gap-2">
              Start learning <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/student/dashboard" className="block text-xs font-semibold text-muted-foreground hover:text-primary">
            Back to dashboard
          </Link>
        </>
      )
    }

    if (status.isBankTransfer) {
      return (
        <>
          <Landmark className="h-14 w-14 text-primary mx-auto" />
          <div className="space-y-1.5">
            <h1 className="text-2xl font-bold text-foreground">Slip received</h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              We have your deposit slip for <strong className="text-foreground">{status.courseTitle}</strong>.
              Our team reviews slips within 24 hours, and the class unlocks as soon as it is approved.
            </p>
          </div>
          <Link href="/student/dashboard" className="block">
            <Button className="w-full h-11 rounded-xl font-semibold">Go to dashboard</Button>
          </Link>
        </>
      )
    }

    if (status.paymentStatus === 'rejected' || cancelled) {
      return (
        <>
          <XCircle className="h-14 w-14 text-destructive mx-auto" />
          <div className="space-y-1.5">
            <h1 className="text-2xl font-bold text-foreground">
              {cancelled ? 'Payment cancelled' : 'Payment did not go through'}
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {cancelled
                ? 'You cancelled before the payment completed. Nothing has been charged.'
                : 'The payment was declined and nothing has been charged. You can try again, or pay by bank transfer instead.'}
            </p>
          </div>
          <Link href={`/student/courses/${status.courseId}`} className="block">
            <Button className="w-full h-11 rounded-xl font-semibold">Try again</Button>
          </Link>
          <Link href="/student/dashboard" className="block text-xs font-semibold text-muted-foreground hover:text-primary">
            Back to dashboard
          </Link>
        </>
      )
    }

    if (timedOut) {
      return (
        <>
          <Clock className="h-14 w-14 text-amber-500 mx-auto" />
          <div className="space-y-1.5">
            <h1 className="text-2xl font-bold text-foreground">Still processing</h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Your payment is taking longer than usual to confirm. This is normally a short delay on
              the bank's side — no action is needed and nothing has been charged twice. Your class
              unlocks automatically once it clears.
            </p>
            <p className="text-xs text-muted-foreground pt-1">
              Reference: <span className="font-mono">{paymentId?.slice(0, 8)}</span>
            </p>
          </div>
          <Button
            onClick={() => window.location.reload()}
            variant="outline"
            className="w-full h-11 rounded-xl font-semibold gap-2"
          >
            <RefreshCw className="h-4 w-4" /> Check again
          </Button>
          <Link href="/student/dashboard" className="block text-xs font-semibold text-muted-foreground hover:text-primary">
            Back to dashboard
          </Link>
        </>
      )
    }

    return (
      <>
        <RefreshCw className="h-14 w-14 text-primary mx-auto animate-spin" />
        <div className="space-y-1.5">
          <h1 className="text-2xl font-bold text-foreground">Confirming your payment</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            We are waiting for the bank to confirm. Please keep this page open — it updates by itself.
          </p>
        </div>
      </>
    )
  }
}

export default function PaymentReturnPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <RefreshCw className="h-8 w-8 text-primary animate-spin" />
        </div>
      }
    >
      <PaymentReturn />
    </Suspense>
  )
}
