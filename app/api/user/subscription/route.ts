import supabase from '@/lib/supabase/supabase'
import { NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()

    // Log the incoming userId for validation
    console.log('Received userId:', userId)

    // Check if userId is valid
    if (!userId || typeof userId !== 'string') {
      console.error('Invalid userId:', userId)
      return new Response(JSON.stringify({ error: 'Invalid userId' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    console.log('Querying user data from Supabase for userId:', userId)

    // Fetch user subscription and other data from the 'users' table
    const { data, error } = await supabase
      .from('users')
      .select('subscription, plan_type, billing_date, auth_method, id')
      .eq('firebase_id', userId)
      .single()

    // Log the response or error from Supabase
    if (error) {
      console.error('Error fetching user subscription from Supabase:', error.message)
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    console.log('Supabase data received:', data)

    // Check if user data exists
    if (!data) {
      console.error('User not found for userId:', userId)
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // If everything is successful, log the data and send it back
    console.log('User data retrieved successfully:', data)
    return new Response(JSON.stringify({ data }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (err) {
    // Log unexpected errors for debugging
    console.error('Unexpected error occurred:', err)
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
