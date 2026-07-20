import Link from 'next/link'
import Navbar from '@/components/Navbar'
import { createClient } from '@/lib/supabase/server'
import { FileText, ArrowLeft, Mail, Phone } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms & Conditions | I See ICT - Waruna Bopitiya',
  description: 'Terms and Conditions governing the use of I See ICT online learning platform and course subscriptions by Waruna Bopitiya.',
}

export default async function TermsAndConditionsPage() {
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
    <div className="min-h-screen bg-background relative flex flex-col justify-between">
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
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
                  Terms & Conditions
                </h1>
                <p className="text-xs text-muted-foreground mt-1">
                  Last Updated: July 2026 • I See ICT by Waruna Bopitiya
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-8 text-foreground/90 text-sm leading-relaxed border-t border-border pt-8">
            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-foreground tracking-tight">1. Acceptance of Terms</h2>
              <p className="text-muted-foreground">
                Welcome to <strong className="text-foreground">I See ICT by Waruna Bopitiya</strong>. By accessing our platform, registering an account, or enrolling in our Advanced Level ICT courses, you agree to comply with and be bound by these Terms and Conditions. Please read them carefully before making transactions or accessing course contents.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-foreground tracking-tight">2. Account Registration & Security</h2>
              <ul className="list-disc pl-5 text-muted-foreground space-y-2">
                <li><strong className="text-foreground">Individual Use Only:</strong> Each account is assigned a unique Student ID (e.g. Student ID: 1001) and is strictly personal to the registered student.</li>
                <li><strong className="text-foreground">No Account Sharing:</strong> You may not share your login credentials, OTP codes, or passwords with anyone else. Multi-user access or reselling account credentials will result in immediate permanent suspension without refund.</li>
                <li><strong className="text-foreground">Accuracy:</strong> You agree to provide true, accurate, and complete information during profile completion.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-foreground tracking-tight">3. Intellectual Property & Anti-Piracy</h2>
              <p className="text-muted-foreground">
                All video lessons, PDF lecture notes, tutorials, software exercises, past paper solutions, and live grading content are the exclusive intellectual property of <strong className="text-foreground">Waruna Bopitiya</strong>.
              </p>
              <ul className="list-disc pl-5 text-muted-foreground space-y-2">
                <li><strong className="text-foreground">Watermarking:</strong> Video streams and PDF documents dynamically render user watermarks (Student ID and registered phone number).</li>
                <li><strong className="text-foreground">Prohibited Actions:</strong> Screen recording, downloading, copying, redistribution, public screening, or uploading course content to social media platforms is strictly illegal and violates Sri Lankan Intellectual Property Laws. Offenders will face criminal prosecution and permanent account ban.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-foreground tracking-tight">4. Course Payments & Access</h2>
              <ul className="list-disc pl-5 text-muted-foreground space-y-2">
                <li><strong className="text-foreground">Fees & Pricing:</strong> All course fees are stated in Sri Lankan Rupees (LKR) and are subject to course structure details.</li>
                <li><strong className="text-foreground">Payment Verification:</strong> Course access is unlocked upon manual verification of bank transfer slips by our administrative team or upon successful real-time payment gateway processing (PayHere).</li>
                <li><strong className="text-foreground">Duration:</strong> Enrolled courses remain accessible for the duration specified in the course description.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-foreground tracking-tight">5. Limitation of Liability</h2>
              <p className="text-muted-foreground">
                We make every effort to maintain 99.9% platform availability and high-quality streaming servers. However, we are not liable for temporary service disruptions caused by external internet service provider outages, power failures, or hardware issues beyond our reasonable control.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-foreground tracking-tight">6. Amendments to Terms</h2>
              <p className="text-muted-foreground">
                We reserve the right to modify or replace these Terms and Conditions at any time. Continued use of the website following changes constitutes acceptance of those updates.
              </p>
            </section>

            <section className="space-y-3 p-6 rounded-xl bg-secondary/30 border border-border">
              <h2 className="text-lg font-semibold text-foreground tracking-tight">7. Contact Information</h2>
              <p className="text-muted-foreground">
                For questions regarding these Terms and Conditions, please contact us:
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
            <Link href="/terms-and-conditions" className="text-primary font-medium">Terms & Conditions</Link>
            <Link href="/refund-policy" className="hover:text-primary transition-colors">Refund Policy</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
