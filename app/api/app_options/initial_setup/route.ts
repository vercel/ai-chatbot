import supabase from '@/lib/supabase/supabase'

export async function POST(request: Request) {
  const res = await request.json()
  const { payment, onboarding_complete, user_id } = res
  if (!payment || !onboarding_complete || !user_id) {
    return
  }
  const { data, error } = await supabase
    .from('classes')
    .upsert({
      payment,
      onboarding_complete
    })
    .eq('user', user_id)
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
