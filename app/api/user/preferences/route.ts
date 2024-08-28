import check_missing_fields from '@/lib/api/check_missing_fields'
import create_response from '@/lib/api/create_response'
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
      return create_response({
        data: { missing_fields },
        status: 400
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
      return create_response({
        data: { error: error.message },
        status: 500
      })
    }

    // Return the upserted data
    return create_response({
      data: { data },
      status: 200
    })
  } catch (err) {
    // Handle unexpected errors
    return create_response({
      data: { error: 'Internal Server Error', details: err },
      status: 500
    })
  }
}

export async function GET(request: Request) {
  try {
    // Extract user_id from query parameters
    const url = new URL(request.url)
    const userId = url.searchParams.get('user_id')

    if (!userId) {
      return create_response({
        data: { error: 'Missing user_id query parameter' },
        status: 400
      })
    }

    // Fetch preferences for the specified user_id
    const { data, error } = await supabase
      .from('preferences')
      .select('*')
      .eq('user', userId)

    if (error) {
      return create_response({ data: { error: error.message }, status: 500 })
    }

    if (!data || data.length === 0) {
      return create_response({
        data: { message: 'No preferences found for the user' },
        status: 404
      })
    }

    // Return the retrieved preferences
    return create_response({ data: { preferences: data }, status: 200 })
  } catch (err) {
    // Handle unexpected errors
    return create_response({
      data: { error: 'Internal Server Error', details: err },
      status: 500
    })
  }
}
