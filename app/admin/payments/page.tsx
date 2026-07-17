'use client'

import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Navbar from '@/components/Navbar'

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
  const [user, setUser] = useState<any>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser()
        if (!currentUser) {
          router.push('/auth/login')
          return
        }
        setUser(currentUser)

        const { data: paymentsData, error: paymentsError } = await supabase
          .from('payments')
          .select('*, courses(title)')
          .eq('status', 'pending')
          .order('created_at', { ascending: false })

        if (paymentsError) throw paymentsError

        if (paymentsData && paymentsData.length > 0) {
          const userIds = [...new Set(paymentsData.map(p => p.user_id))]
          const { data: usersData, error: usersError } = await supabase
            .from('users')
            .select('id, full_name, phone_number, student_id')
            .in('id', userIds)

          if (usersError) throw usersError

          const usersMap = new Map(usersData?.map(u => [u.id, u]) || [])
          const mergedPayments = paymentsData.map(p => ({
            ...p,
            users: usersMap.get(p.user_id) || { full_name: 'Unknown Student', phone_number: 'N/A' }
          }))
          setPayments(mergedPayments)
        } else {
          setPayments([])
        }
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
    <div className="min-h-screen bg-background relative overflow-hidden">
      
      {/* Background patterns */}
      <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none" />
      
      {/* Navigation */}
      <Navbar user={user} isAdmin={true} fullName="Administrator" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative z-10">
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
              <Card key={payment.id} className="border-border overflow-hidden glass-panel rounded-2xl">
                <CardHeader className="p-6">
                  <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                    <div>
                      <CardTitle className="text-foreground text-xl font-bold">
                        {payment.courses?.title}
                      </CardTitle>
                      <CardDescription className="mt-2 text-sm text-muted-foreground font-medium flex flex-wrap gap-x-2 gap-y-1">
                        <span>Student: {payment.users?.full_name} ({payment.users?.phone_number})</span>
                        {payment.users?.student_id && (
                          <span className="text-xs font-mono bg-secondary border border-border px-1.5 py-0.5 rounded text-muted-foreground font-semibold">
                            ID: {payment.users.student_id}
                          </span>
                        )}
                      </CardDescription>
                    </div>
                    <div className="text-left sm:text-right shrink-0">
                      <div className="text-2xl font-bold text-primary">
                        Rs. {Number(payment.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </div>
                      <p className="text-xs text-muted-foreground font-medium mt-0.5">
                        {new Date(payment.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6 pt-0 border-t border-border/40 space-y-4">
                  {/* Bank Slip Preview */}
                  <div className="relative w-full h-96 bg-secondary/15 rounded-xl border border-border/55 overflow-hidden">
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
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl h-11"
                    >
                      {approving === payment.id ? 'Approving...' : '✓ Approve Payment'}
                    </Button>
                    <Button
                      onClick={() => handleReject(payment.id)}
                      disabled={rejecting === payment.id}
                      variant="outline"
                      className="flex-1 border-destructive text-destructive hover:bg-destructive/10 font-semibold rounded-xl h-11"
                    >
                      {rejecting === payment.id ? 'Rejecting...' : '✕ Reject'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="glass-panel text-center py-16 px-6 max-w-md mx-auto rounded-2xl">
            <h3 className="text-xl font-bold text-foreground mb-2">No Pending Payments</h3>
            <p className="text-muted-foreground text-sm">All student slip payments have been reviewed.</p>
          </div>
        )}
      </div>
    </div>
  )
}

