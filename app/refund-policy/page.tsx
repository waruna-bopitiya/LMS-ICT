import Link from 'next/link'
import Navbar from '@/components/Navbar'
import { createClient } from '@/lib/supabase/server'
import { RotateCcw, ArrowLeft, Mail, Phone } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Refund Policy | I See ICT - Waruna Bopitiya',
  description: 'Refund Policy for course enrollments and digital learning subscriptions on I See ICT by Waruna Bopitiya.',
}

export default async function RefundPolicyPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let isAdmin = false
  let fullName = ''

  if (user) {
    const { data: profile } = await supabase
      .from('users')
      .select('is_admin, full_name')
      .eq('id', user.id)
      .single()

    isAdmin = Boolean(profile?.is_admin)
    fullName = profile?.full_name || ''
  }

  return (
    <div className="min-h-screen bg-transparent relative flex flex-col justify-between">
      <div>
        <Navbar user={user} isAdmin={isAdmin} fullName={fullName} />

        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="mb-8">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors font-medium mb-6"
            >
              <ArrowLeft className="h-4 w-4" /> Back to Home
            </Link>

            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                <RotateCcw className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
                  Refund & Cancellation Policy
                </h1>
                <p className="text-xs text-muted-foreground mt-1">
                  Last Updated: July 2026 • I See ICT by Waruna Bopitiya
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-8 text-foreground/90 text-sm leading-relaxed border-t border-border pt-8">
            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-foreground tracking-tight">1. Overview</h2>
              <p className="text-muted-foreground">
                Thank you for enrolling in courses at <strong className="text-foreground">I See ICT by Waruna Bopitiya</strong>. We value your education and strive to deliver the highest quality Advanced Level ICT learning experience. Please read our refund policy below regarding digital course enrollments and payments.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-foreground tracking-tight">2. Digital Educational Content Policy</h2>
              <p className="text-muted-foreground">
                Because our platform provides immediate digital access to pre-recorded HD video lessons, downloadable PDF lecture materials, structured software exercises, and past paper grading resources upon course activation:
              </p>
              <ul className="list-disc pl-5 text-muted-foreground space-y-2">
                <li><strong className="text-foreground">Non-Refundable Access:</strong> Course fees are generally non-refundable once course access has been activated and educational materials have been accessed or viewed.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-foreground tracking-tight">3. Eligible Refund Scenarios</h2>
              <p className="text-muted-foreground">
                We issue refunds under the following specific circumstances:
              </p>
              <ul className="list-disc pl-5 text-muted-foreground space-y-2">
                <li><strong className="text-foreground">Duplicate Payment:</strong> If a student accidentally pays twice for the same course or makes an extra transaction due to a banking error, a 100% refund of the duplicate amount will be processed.</li>
                <li><strong className="text-foreground">Payment Error / Overpayment:</strong> If an amount higher than the stated course fee was charged or transferred by mistake, the excess amount will be refunded.</li>
                <li><strong className="text-foreground">Course Cancellation:</strong> In the rare event that a scheduled course or batch is canceled by I See ICT prior to commencement, a full refund will be issued to all enrolled students.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-foreground tracking-tight">4. Processing Time & Method</h2>
              <ul className="list-disc pl-5 text-muted-foreground space-y-2">
                <li><strong className="text-foreground">Refund Method:</strong> Approved refunds will be initiated back to the original method of payment (bank transfer account or payment card via PayHere).</li>
                <li><strong className="text-foreground">Processing Window:</strong> Refunds are processed within <strong className="text-foreground">3 to 5 business days</strong> after approval. Depending on your financial institution, it may take additional time for the credit to appear on your bank statement.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-foreground tracking-tight">5. Course Batch Transfer Requests</h2>
              <p className="text-muted-foreground">
                If you wish to transfer your enrollment to a different month or batch due to personal or medical reasons, please contact our support team prior to accessing the current month's course materials. Transfers are evaluated on a case-by-case basis by our administration.
              </p>
            </section>

            <section className="space-y-3 p-6 rounded-xl bg-secondary/30 border border-border">
              <h2 className="text-lg font-semibold text-foreground tracking-tight">6. How to Request a Refund</h2>
              <p className="text-muted-foreground">
                To request a duplicate payment refund or batch transfer, please contact our support hotline with your Student ID and bank deposit slip receipt:
              </p>
              <div className="flex flex-col sm:flex-row gap-4 pt-2 text-xs font-mono text-foreground">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-primary" /> support@iseeict.com
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-primary" /> +94 75 493 6451
                </div>
              </div>
            </section>
          </div>
        </main>
      </div>

      <footer className="border-t border-border py-8 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left text-xs text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} I See ICT by Waruna Bopitiya. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/privacy-policy" className="hover:text-primary transition-colors">Privacy Policy</Link>
            <Link href="/terms-and-conditions" className="hover:text-primary transition-colors">Terms & Conditions</Link>
            <Link href="/refund-policy" className="text-primary font-medium">Refund Policy</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
