import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // The ranking view is no longer readable by anon or authenticated roles:
    // it computes cross-student aggregates, so it must run with owner rights
    // and cannot carry RLS. Access goes through the service role here, scoped
    // to the id resolved from the session rather than one supplied by the
    // caller — that filter is the authorization.
    const { data, error } = await createAdminClient()
      .from('student_marks_with_ranks')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true }) // ascending so chart displays chronological progress!

    if (error) {
      console.error('Error fetching student marks:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ marks: data })
  } catch (err: any) {
    console.error('API Error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
