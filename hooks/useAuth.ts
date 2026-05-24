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
        } = await supabase.auth.getUser()
        setUser(user)
      } catch (error) {
        console.error('Error getting user:', error)
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
