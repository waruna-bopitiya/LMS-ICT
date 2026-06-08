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
      <div className="absolute inset-0 bg-grid-pattern opacity-30 pointer-events-none" />
      <div className="absolute top-0 right-0 -z-10 h-[500px] w-[500px] rounded-full bg-primary/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-20 left-0 -z-10 h-[500px] w-[500px] rounded-full bg-violet-600/10 blur-[120px] pointer-events-none" />

      {/* Navigation */}
      <Navbar user={user} isAdmin={isAdmin} fullName={fullName} />

      {/* Hero Section */}
      <section className="relative pt-20 pb-16 md:pt-28 md:pb-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="gaming-badge mb-6">
          🎮 level up your AL ICT skills
        </div>
        <h1 className="text-4xl sm:text-5xl md:text-6.5xl font-extrabold tracking-tight text-foreground mb-6 leading-tight max-w-4xl mx-auto">
          Master the World of <span className="text-gradient gaming-text-glow">Information Technology</span>
        </h1>
        <p className="text-lg sm:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
          Join <strong>I See ICT</strong> by <strong>Waruna Bopitiya</strong>. Access premium video tutorials, comprehensive notes, and interactive assessments designed to secure your 'A' grade.
        </p>
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
          {user ? (
            <Link href={dashboardHref}>
              <Button size="lg" className="bg-primary hover:bg-primary/95 text-primary-foreground font-semibold px-8 py-6 text-base shadow-lg shadow-primary/25 rounded-xl">
                Go to Dashboard <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          ) : (
            <>
              <Link href="/auth/login">
                <Button size="lg" className="bg-primary hover:bg-primary/95 text-primary-foreground font-semibold px-8 py-6 text-base shadow-lg shadow-primary/25 rounded-xl animate-bounce">
                  Get Started Now <ChevronRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <a href="#courses">
                <Button size="lg" variant="outline" className="border-border text-foreground hover:bg-secondary font-semibold px-8 py-6 text-base rounded-xl">
                  Browse Courses
                </Button>
              </a>
            </>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-secondary/10 border-y border-border/40 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground mb-4">
              Everything You Need to Succeed
            </h2>
            <p className="text-muted-foreground text-lg">
              A comprehensive system built specifically for Advanced Level ICT students to study systematically.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, i) => (
              <Card key={i} className="gaming-card border-none shadow-sm overflow-hidden group">
                <CardHeader className="p-6 pb-2">
                  <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${feature.color} mb-5 group-hover:scale-105 transition-transform`}>
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-xl font-bold text-foreground mb-2">{feature.title}</CardTitle>
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
          <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground mb-4">
            Our Available Courses
          </h2>
          <p className="text-muted-foreground text-lg">
            Enroll today and start learning immediately. Select the course that fits your syllabus.
          </p>
        </div>

        {courses && courses.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {courses.map((course) => {
              // Extract course tag
              const isRevision = course.title.toLowerCase().includes('rev')
              const isPaper = course.title.toLowerCase().includes('paper')
              const tag = isRevision ? 'Revision' : isPaper ? 'Paper Class' : 'Theory'
              const { description, imageUrl } = parseCourseDescription(course.description)
              
              return (
                <Link key={course.id} href={`/student/courses/${course.id}`}>
                  <Card className="gaming-card h-full border-none flex flex-col justify-between overflow-hidden cursor-pointer group">
                    <div>
                      {/* Course Image */}
                      <div className="h-44 w-full bg-zinc-950 flex items-center justify-center border-b border-border/40 relative overflow-hidden">
                        <div className="absolute top-4 left-4 bg-primary/20 border border-primary/45 backdrop-blur-md text-primary text-[10px] uppercase font-extrabold px-2.5 py-0.5 rounded-full z-10 tracking-widest shadow-sm">
                          {tag}
                        </div>
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt={course.title}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center text-center p-6 bg-gradient-to-tr from-secondary/80 to-primary/20 w-full h-full">
                            <BookOpen className="h-16 w-16 text-primary/40 group-hover:scale-110 transition-transform duration-300" />
                          </div>
                        )}
                      </div>
                      
                      <CardHeader className="p-6">
                        <CardTitle className="text-xl font-bold text-foreground leading-snug group-hover:text-primary transition-colors">
                          {course.title}
                        </CardTitle>
                        <CardDescription className="text-sm text-muted-foreground mt-2 line-clamp-3">
                          {description || 'Access pre-recorded lectures, tutorials, and materials for this syllabus section.'}
                        </CardDescription>
                      </CardHeader>
                    </div>

                    <CardContent className="p-6 pt-0 space-y-4">
                      <div className="flex items-baseline justify-between border-t border-border/40 pt-4">
                        <span className="text-2xl font-extrabold text-primary">
                          Rs. {Number(course.price).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">One-Time Fee</span>
                      </div>
                      <Button className="w-full bg-primary hover:bg-primary/95 text-primary-foreground font-semibold rounded-xl">
                        View Course Contents
                      </Button>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        ) : (
          <div className="gaming-card text-center py-16 px-6 max-w-md mx-auto">
            <BookOpen className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-foreground mb-1">No Courses Available</h3>
            <p className="text-sm text-muted-foreground mb-6">Our upcoming classes will be published here soon.</p>
          </div>
        )}
      </section>

      {/* Lecturer Spotlight Section */}
      <section id="about" className="py-20 bg-secondary/15 border-y border-border/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            
            {/* Left Side: Photo placeholder / abstract visual */}
            <div className="relative flex justify-center">
              <div className="relative w-full max-w-sm aspect-[4/5] rounded-3xl bg-gradient-to-br from-primary/30 via-indigo-600/15 to-transparent border border-border p-3 overflow-hidden shadow-md">
                <div className="w-full h-full rounded-2xl bg-card flex flex-col items-center justify-center p-6 border border-border text-center">
                  <div className="h-28 w-28 rounded-full bg-primary/10 flex items-center justify-center mb-6 border-2 border-primary/20">
                    <Users className="h-12 w-12 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold text-foreground">Waruna Bopitiya</h3>
                  <p className="text-primary text-sm font-semibold mt-1">Founder & Lecturer</p>
                  <div className="mt-6 space-y-2 text-xs text-muted-foreground font-medium text-left max-w-[240px]">
                    <div className="flex items-center gap-2">✔ 12+ Years Teaching ICT</div>
                    <div className="flex items-center gap-2">✔ BSc. in Information Technology</div>
                    <div className="flex items-center gap-2">✔ Produced Top District Ranks</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side: Description */}
            <div className="space-y-6">
              <span className="text-primary text-sm font-bold uppercase tracking-wider">Meet the Lecturer</span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground leading-tight">
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
                  <Button className="bg-primary hover:bg-primary/95 text-primary-foreground font-semibold px-6 rounded-xl">
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
          <HelpCircle className="h-10 w-10 text-primary mx-auto mb-4" />
          <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-muted-foreground text-lg">
            Have questions about registration, class details, or payments? Find quick answers here.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <details
              key={i}
              className="group border border-border rounded-xl p-4 [&_summary::-webkit-details-marker]:hidden bg-card/40 backdrop-blur-sm transition-all duration-300 open:bg-card shadow-sm"
            >
              <summary className="flex items-center justify-between cursor-pointer focus:outline-none">
                <span className="font-semibold text-foreground text-base pr-4">{faq.q}</span>
                <span className="transition-transform duration-300 group-open:rotate-180 text-primary font-bold">
                  ▼
                </span>
              </summary>
              <div className="mt-4 text-muted-foreground text-sm leading-relaxed border-t border-border/40 pt-4">
                {faq.a}
              </div>
            </details>
          ))}
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 bg-secondary/15 border-t border-border/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12">
            
            {/* Info */}
            <div className="space-y-8">
              <div>
                <h2 className="text-3xl font-extrabold text-foreground mb-3">Get in Touch</h2>
                <p className="text-muted-foreground text-base">
                  Need any assistance with payment uploads, log in, or have queries about the course materials? Contact us directly.
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Phone className="h-5 w-5" />
                  </div>
                  <span className="text-foreground font-semibold text-sm">+94 77 123 4567</span>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Mail className="h-5 w-5" />
                  </div>
                  <span className="text-foreground font-semibold text-sm">support@iseeict.lk</span>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <span className="text-foreground font-semibold text-sm">Colombo, Sri Lanka</span>
                </div>
              </div>
            </div>

            {/* Simple Contact Card */}
            <div className="glass-panel p-8 rounded-2xl shadow-sm border-border flex flex-col justify-center">
              <h3 className="text-xl font-bold text-foreground mb-4">Support Available</h3>
              <p className="text-muted-foreground text-sm leading-relaxed mb-6">
                Our support channels are open Monday to Saturday from 8:00 AM to 6:00 PM. We will respond to payment verifications within 24 hours.
              </p>
              <div className="flex gap-4">
                <a href="tel:+94771234567" className="flex-1">
                  <Button className="w-full bg-primary hover:bg-primary/95 text-primary-foreground font-semibold rounded-xl">
                    Call Hotline
                  </Button>
                </a>
                <a href="mailto:support@iseeict.lk" className="flex-1">
                  <Button variant="outline" className="w-full border-border text-foreground hover:bg-secondary font-semibold rounded-xl">
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
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-indigo-600 text-primary-foreground text-sm font-bold">
              <Laptop className="h-4.5 w-4.5" />
            </div>
            <span className="text-base font-extrabold text-foreground">I See ICT</span>
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
