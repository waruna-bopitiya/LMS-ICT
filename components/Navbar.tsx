'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import ThemeToggle from './ThemeToggle'
import { Button } from '@/components/ui/button'
import { Menu, X, Laptop, LogOut, LayoutDashboard, User, BookOpen, CreditCard, UserCheck, Users } from 'lucide-react'

interface NavbarProps {
  user?: any
  isAdmin?: boolean
  fullName?: string
}

export default function Navbar({ user, isAdmin = false, fullName }: NavbarProps) {
  const router = useRouter()
  const supabase = createClient()
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSignOut = async () => {
    setLoading(true)
    try {
      await supabase.auth.signOut()
      router.push('/auth/login')
      router.refresh()
    } catch (err) {
      console.error('Sign out failed:', err)
    } finally {
      setLoading(false)
    }
  }

  // Navigation Links based on role
  const links = (() => {
    if (!user) {
      return [
        { name: 'Home', href: '/' },
        { name: 'Courses', href: '/#courses' },
        { name: 'About', href: '/#about' },
        { name: 'FAQ', href: '/#faq' },
      ]
    }
    if (isAdmin) {
      return [
        { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
        { name: 'Activate Classes', href: '/admin/activate', icon: UserCheck },
        { name: 'Student Directory', href: '/admin/students', icon: Users },
        { name: 'Manage Courses', href: '/admin/courses', icon: BookOpen },
        { name: 'Review Payments', href: '/admin/payments', icon: CreditCard },
      ]
    }
    return [
      { name: 'Browse Courses', href: '/', icon: BookOpen },
      { name: 'Student Dashboard', href: '/student/dashboard', icon: LayoutDashboard },
      { name: 'My Profile', href: '/student/profile', icon: User },
    ]
  })()

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          
          {/* Logo Brand */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-transform group-hover:scale-105">
              <Laptop className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold tracking-tight text-foreground group-hover:text-primary transition-colors">
                I See ICT
              </span>
              <span className="text-[10px] text-muted-foreground font-medium -mt-1">
                by Waruna Bopitiya
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-6">
            {links.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors duration-200"
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* Desktop Right side CTA */}
          <div className="hidden md:flex items-center gap-4">
            <ThemeToggle />
            {user ? (
              <div className="flex items-center gap-4">
                {fullName && (
                  <span className="text-sm font-semibold text-muted-foreground hidden lg:inline">
                    {fullName}
                  </span>
                )}
                <Button
                  onClick={handleSignOut}
                  disabled={loading}
                  variant="outline"
                  size="sm"
                  className="gap-2 border-border text-foreground hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
                >
                  <LogOut className="h-4 w-4" />
                  {loading ? 'Signing out...' : 'Sign Out'}
                </Button>
              </div>
            ) : (
              <Link href="/auth/login">
                <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-5 rounded-lg">
                  Sign In
                </Button>
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center gap-2 md:hidden">
            <ThemeToggle />
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-secondary/50 focus:outline-none transition-colors"
            >
              <span className="sr-only">Open main menu</span>
              {isOpen ? <X className="block h-6 w-6" /> : <Menu className="block h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Panel */}
      {isOpen && (
        <div className="md:hidden border-t border-border bg-background animate-in slide-in-from-top duration-200">
          <div className="space-y-1 px-4 pt-3 pb-4">
            {links.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-base font-semibold text-muted-foreground hover:text-primary hover:bg-secondary transition-all"
              >
                {link.icon && <link.icon className="h-5 w-5" />}
                {link.name}
              </Link>
            ))}
            
            {/* Mobile Auth button */}
            <div className="pt-4 border-t border-border mt-3 px-3">
              {user ? (
                <div className="flex flex-col gap-3">
                  {fullName && (
                    <div className="text-sm font-semibold text-foreground">
                      Hello, {fullName}
                    </div>
                  )}
                  <Button
                    onClick={() => {
                      setIsOpen(false)
                      handleSignOut()
                    }}
                    disabled={loading}
                    variant="destructive"
                    className="w-full gap-2 text-white"
                  >
                    <LogOut className="h-4 w-4" />
                    {loading ? 'Signing out...' : 'Sign Out'}
                  </Button>
                </div>
              ) : (
                <Link href="/auth/login" onClick={() => setIsOpen(false)}>
                  <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">
                    Sign In
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
