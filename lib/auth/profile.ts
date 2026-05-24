import { redirect } from 'next/navigation'
import type { SupabaseClient } from '@supabase/supabase-js'

export type UserProfile = {
  id: string
  phone_number: string | null
  full_name: string | null
  email: string | null
  school: string | null
  district: string | null
  guardian_phone: string | null
  is_admin: boolean | null
}

export async function requireCompletedProfile(
  supabase: SupabaseClient,
  userId: string
) {
  const { data: profile } = await supabase
    .from('users')
    .select(
      'id, phone_number, full_name, email, school, district, guardian_phone, is_admin'
    )
    .eq('id', userId)
    .single<UserProfile>()

  if (!profile?.is_admin && !profile?.full_name) {
    redirect('/student/profile')
  }

  return profile
}
