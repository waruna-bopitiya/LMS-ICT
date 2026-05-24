'use client'

import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Image from 'next/image'

interface Payment {
  id: string
  user_id: string
  course_id: string
  bank_slip_url: string
  amount: number
  status: string
  created_at: string
  courses: { title: string }
  users: { full_name: string; phone_number: string }
}

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [approving, setApproving] = useState<string | null>(null)
  const [rejecting, setRejecting] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/auth/login')
          return
        }

        const { data, error } = await supabase
          .from('payments')
          .select('*, courses(title), users(full_name, phone_number)')
          .eq('status', 'pending')
          .order('created_at', { ascending: false })

        if (error) throw error
        setPayments(data || [])
      } catch (error) {
        console.error('Error fetching payments:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchPayments()
  }, [supabase, router])

  const handleApprove = async (paymentId: string) => {
    setApproving(paymentId)
    try {
      const response = await fetch('/api/admin/payments/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to approve payment')
      }

      // Remove from list
      setPayments(payments.filter(p => p.id !== paymentId))
    } catch (error) {
      console.error('Error approving payment:', error)
      alert('Failed to approve payment')
    } finally {
      setApproving(null)
    }
  }

  const handleReject = async (paymentId: string) => {
    setRejecting(paymentId)
    try {
      const response = await fetch('/api/admin/payments/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reject payment')
      }

      // Remove from list
      setPayments(payments.filter(p => p.id !== paymentId))
    } catch (error) {
      console.error('Error rejecting payment:', error)
      alert('Failed to reject payment')
    } finally {
      setRejecting(null)
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-2">Payment Review</h1>
          <p className="text-muted-foreground">Review and approve student bank slip payments</p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading payments...</p>
          </div>
        ) : payments.length > 0 ? (
          <div className="grid gap-6">
            {payments.map((payment) => (
              <Card key={payment.id} className="border-border overflow-hidden">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-foreground">
                        {payment.courses?.title}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        Student: {payment.users?.full_name} ({payment.users?.phone_number})
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-primary">
                        ${Number(payment.amount).toFixed(2)}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {new Date(payment.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Bank Slip Preview */}
                  <div className="relative w-full h-96 bg-secondary/10 rounded-lg border border-border overflow-hidden">
                    <img
                      src={payment.bank_slip_url}
                      alt="Bank Slip"
                      className="w-full h-full object-contain"
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4">
                    <Button
                      onClick={() => handleApprove(payment.id)}
                      disabled={approving === payment.id}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                    >
                      {approving === payment.id ? 'Approving...' : '✓ Approve Payment'}
                    </Button>
                    <Button
                      onClick={() => handleReject(payment.id)}
                      disabled={rejecting === payment.id}
                      variant="outline"
                      className="flex-1 border-destructive text-destructive hover:bg-destructive/10"
                    >
                      {rejecting === payment.id ? 'Rejecting...' : '✕ Reject'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <h3 className="text-xl font-semibold text-foreground mb-4">No Pending Payments</h3>
            <p className="text-muted-foreground">All payments have been reviewed</p>
          </div>
        )}
      </div>
    </div>
  )
}
