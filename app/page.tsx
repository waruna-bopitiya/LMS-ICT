import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Navbar from '@/components/Navbar'
import { BookOpen, Video, FileText, CheckCircle2, ChevronRight, Award, Users, BookOpenCheck, HelpCircle, Phone, Mail, MapPin, Laptop } from 'lucide-react'
import { parseCourseDescription } from '@/lib/utils'

export default async function Home() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  let dashboardHref = '/student/dashboard'
  let isAdmin = false
  let fullName = ''
  if (user) {
    const { data: profile } = await supabase
      .from('users')
      .select('is_admin, full_name')
      .eq('id', user.id)
      .single()

    if (profile?.is_admin) {
      dashboardHref = '/admin/dashboard'
      isAdmin = true
    }
    fullName = profile?.full_name || ''
  }

  // Get all courses
  const { data: courses } = await supabase
    .from('courses')
    .select('*')
    .order('created_at', { ascending: false })

  const features = [
    {
      title: 'High-Quality Video Lessons',
      description: 'Access clear, step-by-step video tutorials covering the complete A/L ICT syllabus, available to stream anytime.',
      icon: Video,
      color: 'text-blue-500 bg-blue-500/10'
    },
    {
      title: 'Comprehensive Study Materials',
      description: 'Download lesson notes, past papers, model questions, and revision guides directly as PDF files.',
      icon: FileText,
      color: 'text-purple-500 bg-purple-500/10'
    },
    {
      title: 'Assessments & Submissions',
      description: 'Submit assignments online and receive constructive feedback to track your exam readiness and progress.',
      icon: CheckCircle2,
      color: 'text-emerald-500 bg-emerald-500/10'
    }
  ]

  const faqs = [
    {
      q: 'How do I register for a class?',
      a: 'Click on "Sign In" or "Get Started" and enter your mobile phone number. You will receive a verification OTP. Once verified, complete your profile details to access the course catalog.'
    },
    {
      q: 'How do I pay for courses?',
      a: 'Each course has a bank transfer payment option. Transfer the exact amount to the bank account specified in the enrollment form, upload a photo of the bank slip, and our team will approve your access within 24 hours.'
    },
    {
      q: 'Can I watch the videos on my phone?',
      a: 'Yes! Our LMS platform is fully responsive and optimized for mobile devices, tablets, and laptops. You can learn anywhere, anytime.'
    },
    {
      q: 'What should I do if my payment is pending for too long?',
      a: 'Payment approvals normally take less than 24 hours. If it takes longer, please contact our support hotline with your phone number and course details.'
    }
  ]

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">

      {/* Background decoration grid */}
      <div className="absolute inset-0 bg-grid-pattern opacity-60 pointer-events-none" />
      <div className="absolute top-0 right-0 -z-10 h-[500px] w-[500px] rounded-full bg-primary/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-20 left-0 -z-10 h-[500px] w-[500px] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />

      {/* Navigation */}
      <Navbar user={user} isAdmin={isAdmin} fullName={fullName} />

      {/* Hero Section */}
      <section className="relative pt-20 pb-16 md:pt-28 md:pb-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="tech-badge mb-6 animate-fade-up">
          <span className="status-dot" />
          Enrolling now for the 2026 A/L cohort
        </div>
        <h1 className="text-4xl sm:text-5xl md:text-6.5xl font-bold tracking-tight text-foreground mb-6 leading-[1.1] max-w-4xl mx-auto animate-fade-up [animation-delay:80ms]">
          Master the World of <span className="text-gradient">Information Technology</span>
        </h1>
        <p className="text-lg sm:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed animate-fade-up [animation-delay:160ms]">
          Join <strong className="text-foreground font-semibold">I See ICT</strong> by <strong className="text-foreground font-semibold">Waruna Bopitiya</strong>. Access premium video tutorials, comprehensive notes, and interactive assessments designed to secure your 'A' grade.
        </p>
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4 animate-fade-up [animation-delay:240ms]">
          {user ? (
            <Link href={dashboardHref}>
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-8 py-6 text-base rounded-lg transition-transform hover:-translate-y-0.5">
                Go to Dashboard <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          ) : (
            <>
              <Link href="/auth/login">
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-8 py-6 text-base rounded-lg transition-transform hover:-translate-y-0.5">
                  Get Started Now <ChevronRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <a href="#courses">
                <Button size="lg" variant="outline" className="border-border text-foreground hover:bg-secondary font-semibold px-8 py-6 text-base rounded-lg transition-transform hover:-translate-y-0.5">
                  Browse Courses
                </Button>
              </a>
            </>
          )}
        </div>

        {/* Product-preview style panel for tech credibility */}
        <div className="mt-16 max-w-3xl mx-auto animate-fade-up [animation-delay:320ms]">
          <div className="code-chrome">
            <span className="h-3 w-3 rounded-full bg-destructive/60" />
            <span className="h-3 w-3 rounded-full bg-amber-500/60" />
            <span className="h-3 w-3 rounded-full bg-emerald-500/60" />
            <span className="ml-3 text-xs text-muted-foreground font-mono">student/dashboard.tsx</span>
          </div>
          <div className="rounded-b-xl border border-border bg-card/60 backdrop-blur-md p-6 text-left font-mono text-xs sm:text-sm leading-relaxed shadow-sm">
            <p><span className="text-primary">const</span> <span className="text-foreground">progress</span> = <span className="text-emerald-500">await</span> student.track(<span className="text-amber-500">'AL_ICT_2026'</span>)</p>
            <p className="text-muted-foreground">// video lessons · notes · past papers · live grading</p>
            <p><span className="text-primary">return</span> <span className="text-foreground">progress</span>.<span className="text-primary">grade</span> === <span className="text-amber-500">'A'</span> <span className="text-muted-foreground">✓</span></p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 border-y border-border/60 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4 tracking-tight">
              Everything You Need to Succeed
            </h2>
            <p className="text-muted-foreground text-lg">
              A comprehensive system built specifically for Advanced Level ICT students to study systematically.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <Card key={i} className="tech-card p-0 shadow-none overflow-hidden group">
                <CardHeader className="p-6 pb-2">
                  <div className={`h-11 w-11 rounded-lg flex items-center justify-center ${feature.color} mb-5 group-hover:scale-105 transition-transform`}>
                    <feature.icon className="h-5.5 w-5.5" />
                  </div>
                  <CardTitle className="text-lg font-semibold text-foreground mb-2">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent className="p-6 pt-0">
                  <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Available Courses Section */}
      <section id="courses" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4 tracking-tight">
            Our Available Courses
          </h2>
          <p className="text-muted-foreground text-lg">
            Enroll today and start learning immediately. Select the course that fits your syllabus.
          </p>
        </div>

        {courses && courses.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => {
              // Extract course tag
              const isRevision = course.title.toLowerCase().includes('rev')
              const isPaper = course.title.toLowerCase().includes('paper')
              const tag = isRevision ? 'Revision' : isPaper ? 'Paper Class' : 'Theory'
              const { description, imageUrl } = parseCourseDescription(course.description)

              return (
                <Link key={course.id} href={`/student/courses/${course.id}`}>
                  <Card className="tech-card p-0 h-full flex flex-col justify-between overflow-hidden cursor-pointer group shadow-none">
                    <div>
                      {/* Course Image */}
                      <div className="h-44 w-full bg-secondary flex items-center justify-center border-b border-border relative overflow-hidden">
                        <div className="absolute top-4 left-4 border border-border bg-background/80 backdrop-blur-md text-foreground text-[10px] uppercase font-semibold px-2.5 py-1 rounded-full z-10 tracking-wide">
                          {tag}
                        </div>
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt={course.title}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center text-center p-6 bg-secondary w-full h-full">
                            <BookOpen className="h-14 w-14 text-muted-foreground/30 group-hover:scale-110 transition-transform duration-300" />
                          </div>
                        )}
                      </div>

                      <CardHeader className="p-6">
                        <CardTitle className="text-lg font-semibold text-foreground leading-snug group-hover:text-primary transition-colors">
                          {course.title}
                        </CardTitle>
                        <CardDescription className="text-sm text-muted-foreground mt-2 line-clamp-3">
                          {description || 'Access pre-recorded lectures, tutorials, and materials for this syllabus section.'}
                        </CardDescription>
                      </CardHeader>
                    </div>

                    <CardContent className="p-6 pt-0 space-y-4">
                      <div className="flex items-baseline justify-between border-t border-border pt-4">
                        <span className="text-2xl font-bold text-foreground">
                          Rs. {Number(course.price).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-widest">One-Time Fee</span>
                      </div>
                      <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg">
                        View Course Contents
                      </Button>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        ) : (
          <div className="tech-card text-center py-16 px-6 max-w-md mx-auto shadow-none">
            <BookOpen className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-1">No Courses Available</h3>
            <p className="text-sm text-muted-foreground mb-6">Our upcoming classes will be published here soon.</p>
          </div>
        )}
      </section>

      {/* Lecturer Spotlight Section */}
      <section id="about" className="py-20 bg-secondary/30 border-y border-border/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">

            {/* Left Side: Photo placeholder / abstract visual */}
            <div className="relative flex justify-center">
              <div className="tech-card w-full max-w-sm aspect-4/5 p-3 shadow-none">
                <div className="w-full h-full rounded-lg bg-card flex flex-col items-center justify-center p-6 border border-border text-center">
                  <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center mb-6 border border-primary/20">
                    <Users className="h-11 w-11 text-primary" />
                  </div>
                  <h3 className="text-2xl font-semibold text-foreground">Waruna Bopitiya</h3>
                  <p className="text-primary text-sm font-medium mt-1">Founder & Lecturer</p>
                  <div className="mt-6 space-y-2 text-xs text-muted-foreground font-medium text-left max-w-[240px]">
                    <div className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" /> 12+ Years Teaching ICT</div>
                    <div className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" /> BSc. in Information Technology</div>
                    <div className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" /> Produced Top District Ranks</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side: Description */}
            <div className="space-y-6">
              <span className="text-primary text-sm font-semibold uppercase tracking-wider">Meet the Lecturer</span>
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground leading-tight tracking-tight">
                Learn from the Expert: Waruna Bopitiya
              </h2>
              <p className="text-muted-foreground text-base leading-relaxed">
                Waruna Bopitiya is a prominent ICT educator in Sri Lanka, helping thousands of Advanced Level students unlock their potential. With an engaging, concept-driven teaching method, complex IT theories are simplified.
              </p>
              <p className="text-muted-foreground text-base leading-relaxed">
                His curriculum covers essential syllabus modules including Database Systems, Computer Networking, Web Development, Programming (Python), and Operating Systems with high relevance to local examination guidelines.
              </p>
              <div className="pt-2">
                <a href="#courses">
                  <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-6 rounded-lg">
                    View Course Catalog
                  </Button>
                </a>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <HelpCircle className="h-9 w-9 text-primary mx-auto mb-4" />
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4 tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="text-muted-foreground text-lg">
            Have questions about registration, class details, or payments? Find quick answers here.
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <details
              key={i}
              className="group border border-border rounded-lg p-4 [&_summary::-webkit-details-marker]:hidden bg-card transition-all duration-300 hover:border-primary/30"
            >
              <summary className="flex items-center justify-between cursor-pointer focus:outline-none">
                <span className="font-semibold text-foreground text-base pr-4">{faq.q}</span>
                <ChevronRight className="h-4 w-4 text-primary shrink-0 transition-transform duration-300 group-open:rotate-90" />
              </summary>
              <div className="mt-4 text-muted-foreground text-sm leading-relaxed border-t border-border pt-4">
                {faq.a}
              </div>
            </details>
          ))}
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 bg-secondary/30 border-t border-border/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12">

            {/* Info */}
            <div className="space-y-8">
              <div>
                <h2 className="text-3xl font-bold text-foreground mb-3 tracking-tight">Get in Touch</h2>
                <p className="text-muted-foreground text-base">
                  Need any assistance with payment uploads, log in, or have queries about the course materials? Contact us directly.
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-secondary text-primary">
                    <Phone className="h-5 w-5" />
                  </div>
                  <span className="text-foreground font-medium text-sm">+94 77 123 4567</span>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-secondary text-primary">
                    <Mail className="h-5 w-5" />
                  </div>
                  <span className="text-foreground font-medium text-sm">support@iseeict.lk</span>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-secondary text-primary">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <span className="text-foreground font-medium text-sm">Colombo, Sri Lanka</span>
                </div>
              </div>
            </div>

            {/* Simple Contact Card */}
            <div className="glass-panel p-8 rounded-xl flex flex-col justify-center">
              <h3 className="text-xl font-semibold text-foreground mb-4">Support Available</h3>
              <p className="text-muted-foreground text-sm leading-relaxed mb-6">
                Our support channels are open Monday to Saturday from 8:00 AM to 6:00 PM. We will respond to payment verifications within 24 hours.
              </p>
              <div className="flex gap-4">
                <a href="tel:+94771234567" className="flex-1">
                  <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg">
                    Call Hotline
                  </Button>
                </a>
                <a href="mailto:support@iseeict.lk" className="flex-1">
                  <Button variant="outline" className="w-full border-border text-foreground hover:bg-secondary font-semibold rounded-lg">
                    Email Support
                  </Button>
                </a>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-10 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-bold">
              <Laptop className="h-4.5 w-4.5" />
            </div>
            <span className="text-base font-bold text-foreground">I See ICT</span>
          </div>
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} I See ICT by Waruna Bopitiya. All rights reserved.
          </p>
          <div className="flex gap-6 text-xs text-muted-foreground">
            <Link href="/" className="hover:text-primary transition-colors">Privacy Policy</Link>
            <Link href="/" className="hover:text-primary transition-colors">Terms of Service</Link>
          </div>
        </div>
      </footer>

    </div>
  )
}
