import supabase from '@/lib/supabase/supabase'

export async function POST(request: Request) {
  const res = await request.json()
  const { firebase_id } = res
  const { data, error } = await supabase
    .from('user_progress')
    .select(
      `
      *,
      users (
        id,
        firebase_id,
        name -- Include other columns from the users table if needed
      )
    `
    )
    .eq('users.firebase_id', firebase_id)
    .single()
  if (error) throw error

  return Response.json({ data })
}
