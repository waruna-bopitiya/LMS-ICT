'use client'

import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

interface User {
  id: string
  email?: string
  user_metadata?: Record<string, any>
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      try {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser()

        if (error) {
          if (error.message?.includes('Refresh Token') || error.message?.includes('JWT')) {
            await supabase.auth.signOut({ scope: 'local' })
          }
          setUser(null)
        } else {
          setUser(user)
        }
      } catch {
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    getUser()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => {
      subscription?.unsubscribe()
    }
  }, [])

  return { user, loading }
}
