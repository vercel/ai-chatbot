import supabase from '@/lib/supabase/supabase'

export async function POST(request: Request) {
  const res = await request.json()
  const { user_id } = res
  if (!user_id) {
    return
  }
  const { data, error } = await supabase
    .from('users')
    .select()
    .eq('firebase_id', user_id)
  if (error) throw error

  return Response.json({ data })
}
export async function GET(request: Request) {
  const data = {
    payment: false,
    onboarding_complete: false
  }

  return Response.json({ data })
}
