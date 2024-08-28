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

export async function GET(request: Request) {
  try {
    // Extract user_id from query parameters
    const url = new URL(request.url)
    const userId = url.searchParams.get('user_id')

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'Missing user_id query parameter' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    // Fetch preferences for the specified user_id
    const { data, error } = await supabase
      .from('preferences')
      .select('*')
      .eq('user', userId)

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    if (!data || data.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No preferences found for the user' }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    // Return the retrieved preferences
    return new Response(JSON.stringify({ preferences: data }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (err) {
    // Handle unexpected errors
    return new Response(
      JSON.stringify({ error: 'Internal Server Error', details: err }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}
