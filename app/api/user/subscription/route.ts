import supabase from '@/lib/supabase/supabase'

export async function POST(request: Request) {
  const res = await request.json()
  console.log(res)
  const { data, error } = await supabase.from('classes').select()
  if (error) throw error

  return Response.json({ data })
}
