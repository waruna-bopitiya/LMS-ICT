import Link from 'next/link'
import Navbar from '@/components/Navbar'
import { createClient } from '@/lib/supabase/server'
import { Shield, ArrowLeft, Mail, Phone } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy | I See ICT - Waruna Bopitiya',
  description: 'Privacy Policy for I See ICT learning platform by Waruna Bopitiya. Learn how we collect, use, and protect your personal data.',
}

export default async function PrivacyPolicyPage() {
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
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
                  Privacy Policy
                </h1>
                <p className="text-xs text-muted-foreground mt-1">
                  Last Updated: July 2026 • I See ICT by Waruna Bopitiya
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-8 text-foreground/90 text-sm leading-relaxed border-t border-border pt-8">
            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-foreground tracking-tight">1. Introduction</h2>
              <p className="text-muted-foreground">
                At <strong className="text-foreground">I See ICT by Waruna Bopitiya</strong> ("we", "our", or "us"), we are committed to protecting the privacy and security of our students' and visitors' personal information. This Privacy Policy outlines how we collect, use, and safeguard your data when you visit our website, register an account, or enroll in our Advanced Level ICT online courses.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-foreground tracking-tight">2. Information We Collect</h2>
              <p className="text-muted-foreground">
                We collect information necessary to provide you with seamless access to educational materials, verify course payments, and maintain platform security:
              </p>
              <ul className="list-disc pl-5 text-muted-foreground space-y-2">
                <li><strong className="text-foreground">Personal Profile Data:</strong> Full name, phone number, parent/guardian phone number, district, school, and optional email address provided during account registration.</li>
                <li><strong className="text-foreground">Unique Identifier:</strong> An auto-generated Student ID (e.g., Student ID: 1001) associated with your profile.</li>
                <li><strong className="text-foreground">Payment Verification Data:</strong> Bank deposit/transfer slip photos uploaded for manual payment verification by our administration team.</li>
                <li><strong className="text-foreground">Technical & Usage Data:</strong> Video playback progress, assignment submissions, device info, and IP address for watermarking and security logging.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-foreground tracking-tight">3. How We Use Your Information</h2>
              <p className="text-muted-foreground">
                We use the collected information for the following specific purposes:
              </p>
              <ul className="list-disc pl-5 text-muted-foreground space-y-2">
                <li>To grant access to enrolled video lessons, lecture notes, and assignments.</li>
                <li>To verify bank transfer payment slips and activate course access.</li>
                <li>To display dynamic watermarks (Student ID & Phone Number) on video streams and PDF notes to prevent copyright infringement.</li>
                <li>To send important class announcements, OTP verification SMS, or course updates.</li>
                <li>To detect and prevent unauthorized account sharing or fraudulent access.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-foreground tracking-tight">4. Information Sharing & Third Parties</h2>
              <p className="text-muted-foreground">
                We respect your privacy and <strong className="text-foreground">do not sell, rent, or trade</strong> your personal information to third parties. We may share data only with trusted infrastructure providers required to operate the service:
              </p>
              <ul className="list-disc pl-5 text-muted-foreground space-y-2">
                <li><strong className="text-foreground">Database & Auth Infrastructure:</strong> Supabase (encrypted database and authentication services).</li>
                <li><strong className="text-foreground">Payment Processors:</strong> Trusted banking partners and online payment gateways (e.g., PayHere) for secure transaction handling.</li>
                <li><strong className="text-foreground">SMS Gateway:</strong> FitSMS / local gateways for sending OTP codes and account alerts.</li>
                <li><strong className="text-foreground">Legal Obligations:</strong> When required by law or valid legal requests under Sri Lankan jurisdiction.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-foreground tracking-tight">5. Data Security</h2>
              <p className="text-muted-foreground">
                We implement industry-standard encryption protocols (SSL/TLS) and secure database access policies to protect your personal information against unauthorized access, disclosure, or alteration. However, no internet transmission is 100% secure, and users are responsible for keeping their account credentials confidential.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-foreground tracking-tight">6. Cookies & Storage</h2>
              <p className="text-muted-foreground">
                We use secure HTTP cookies to maintain your login session and store preference settings. You may disable cookies in your browser settings, but doing so will prevent you from logging in and accessing course materials.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-foreground tracking-tight">7. Changes to This Policy</h2>
              <p className="text-muted-foreground">
                We reserve the right to update this Privacy Policy at any time. Any updates will be posted on this page with a revised date.
              </p>
            </section>

            <section className="space-y-3 p-6 rounded-xl bg-secondary/30 border border-border">
              <h2 className="text-lg font-semibold text-foreground tracking-tight">8. Contact Us</h2>
              <p className="text-muted-foreground">
                If you have questions regarding this Privacy Policy or wish to inquire about your data, please contact our support team:
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
            <Link href="/privacy-policy" className="text-primary font-medium">Privacy Policy</Link>
            <Link href="/terms-and-conditions" className="hover:text-primary transition-colors">Terms & Conditions</Link>
            <Link href="/refund-policy" className="hover:text-primary transition-colors">Refund Policy</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
