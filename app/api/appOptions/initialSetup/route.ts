import supabase from '@/lib/supabase/supabase'

export async function POST(request: Request) {
  const res = await request.json()
  console.log(res)
  const data = {
    payment: false,
    onboarding_complete: false
  }

  return Response.json({ data })
}
