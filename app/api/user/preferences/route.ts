import check_missing_fields from '@/lib/api/check_missing_fields'
import supabase from '@/lib/supabase/supabase'

export async function POST(request: Request) {
  try {
    const res = await request.json()

    // Check for missing fields
    const missing_fields = check_missing_fields({
      fields: ['user_id', 'preferences'],
      reqBody: res
    })

    if (missing_fields) {
      return new Response(JSON.stringify({ missing_fields }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Prepare preferences data for upsert
    const preferencesToUpsert = res.preferences.map((preference: string) => ({
      user: res.user_id,
      preference: preference
    }))

    // Perform the upsert operation
    const { data, error } = await supabase
      .from('preferences')
      .upsert(preferencesToUpsert)

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Return the upserted data
    return new Response(JSON.stringify({ data }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (err) {
    // Handle unexpected errors
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
