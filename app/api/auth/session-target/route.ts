import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ target: '/auth/login' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('users')
      .select('is_admin, full_name, password_set_at')
      .eq('id', user.id)
      .single()

    if (profile?.is_admin) {
      return NextResponse.json({ target: '/admin/dashboard' })
    }

    if (!profile?.full_name || !profile?.password_set_at) {
      return NextResponse.json({ target: '/student/profile' })
    }

    return NextResponse.json({ target: '/student/dashboard' })
  } catch (error) {
    console.error('Session target error:', error)
    return NextResponse.json({ target: '/student/dashboard' })
  }
}
