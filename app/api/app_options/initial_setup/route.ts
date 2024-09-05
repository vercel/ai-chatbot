import create_response from '@/lib/api/create_response'
import supabase from '@/lib/supabase/supabase'
import { NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
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
  return create_response({
    request,
    data,
    status: 200
  })
}
export async function GET(request: NextRequest) {
  const data = {
    payment: false,
    onboarding_complete: false
  }
  return create_response({
    request,
    data,
    status: 200
  })
}
