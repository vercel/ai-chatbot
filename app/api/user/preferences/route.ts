import check_missing_fields from '@/lib/api/check_missing_fields'
import supabase from '@/lib/supabase/supabase'

export async function POST(request: Request) {
  const res = await request.json()
  const missing_fields = check_missing_fields({
    fields: ['user_id', 'preferences'],
    reqBody: res
  })
  if (missing_fields) {
    return Response.json({ missing_fields })
  }
  const preferencesToUpsert = res.preferences.map((preference: string) => ({
    user: res.user_id,
    preference: preference
  }))
  const { data, error } = await supabase
    .from('preferences')
    .upsert(preferencesToUpsert)
  if (error) throw error

  return Response.json({ data })
}
