import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch marks with ranks for this logged-in student from the view
    const { data, error } = await supabase
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
