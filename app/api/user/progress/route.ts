import supabase from '@/lib/supabase/supabase'
import check_missing_fields from '@/lib/api/check_missing_fields'
import create_response from '@/lib/api/create_response'

export async function POST(request: Request) {
  try {
    const res = await request.json()

    // Check for missing fields
    const missing_fields = check_missing_fields({
      fields: ['firebase_id'],
      reqBody: res
    })

    if (missing_fields) {
      return create_response({
        data: { missing_fields },
        status: 400
      })
    }

    const { firebase_id } = res

    // Query the database
    const { data, error } = await supabase
      .from('user_progress')
      .select(
        `
        *,
        users (
          id,
          firebase_id
        )
      `
      )
      .eq('users.firebase_id', firebase_id)
      .single()

    if (error) {
      return create_response({
        data: { error: error.message },
        status: 500
      })
    }

    // Return the fetched data
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
    // Extract firebase_id from query parameters
    const url = new URL(request.url)
    const firebaseId = url.searchParams.get('firebase_id')

    if (!firebaseId) {
      return create_response({
        data: { error: 'Missing firebase_id query parameter' },
        status: 400
      })
    }

    // Query the database to get the user's progress
    const { data, error } = await supabase
      .from('user_progress')
      .select(
        `
        *,
        users (
          id,
          firebase_id
        )
      `
      )
      .eq('users.firebase_id', firebaseId)
      .single()

    if (error) {
      return create_response({
        data: { error: error.message },
        status: 500
      })
    }

    if (!data) {
      return create_response({
        data: {
          message: 'No user progress found for the provided firebase_id'
        },
        status: 404
      })
    }

    // Return the retrieved user progress data
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
