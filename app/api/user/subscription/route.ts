import supabase from '@/lib/supabase/supabase'

export async function POST(request: Request) {
  const res = await request.json()
  console.log(res)
  /*   const { data, error } = await supabase.from('classes').select()
  if (error) throw error */
  const data = {
    active: true,
    planType: 'anual',
    amount: '$71.88 USD',
    nextPaymentDate: 'Febrero 15 2025',
    unlimitedClasses: true,
    supportAvailable: true
  }
  return Response.json({ data })
}
