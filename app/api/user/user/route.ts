import supabase from '@/lib/supabase/supabase'
import create_response from '@/lib/api/create_response'
import check_missing_fields from '@/lib/api/check_missing_fields'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId || typeof userId !== 'string') {
      return create_response({
        data: { error: 'Invalid or missing userId' },
        status: 400
      })
    }

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('firebase_id', userId)
      .single()

    if (error) {
      console.error('Error fetching user data:', error.message)
      return create_response({
        data: { error: error.message },
        status: 500
      })
    }

    if (!data) {
      return create_response({
        data: { error: 'User not found' },
        status: 404
      })
    }

    return create_response({
      data: { data },
      status: 200
    })
  } catch (err) {
    console.error('Error handling GET request:', err)
    return create_response({
      data: { error: 'Internal Server Error' },
      status: 500
    })
  }
}

export async function POST(request: Request) {
  try {
    const res = await request.json()

    // Check for missing fields
    const missing_fields = check_missing_fields({
      fields: ['userId'],
      reqBody: res
    })

    if (missing_fields) {
      return create_response({
        data: { missing_fields },
        status: 400
      })
    }

    const { userId } = res

    const { data, error } = await supabase.from('users').insert([
      {
        firebase_id: userId,
        subscription: false
      }
    ])

    if (error) {
      console.error('Error creating user:', error.message)
      return create_response({
        data: { error: error.message },
        status: 500
      })
    }

    return create_response({
      data: { data },
      status: 201
    })
  } catch (err) {
    console.error('Error handling POST request:', err)
    return create_response({
      data: { error: 'Internal Server Error' },
      status: 500
    })
  }
}

export async function PATCH(request: Request) {
  try {
    const res = await request.json()

    // Check for missing fields
    const missing_fields = check_missing_fields({
      fields: ['userId'],
      reqBody: res
    })

    if (missing_fields) {
      return create_response({
        data: { missing_fields },
        status: 400
      })
    }

    const { userId, ...updates } = res

    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('firebase_id', userId)
      .single()

    if (error) {
      console.error('Error updating user:', error.message)
      return create_response({
        data: { error: error.message },
        status: 500
      })
    }

    return create_response({
      data: { data },
      status: 200
    })
  } catch (err) {
    console.error('Error handling PATCH request:', err)
    return create_response({
      data: { error: 'Internal Server Error' },
      status: 500
    })
  }
}
