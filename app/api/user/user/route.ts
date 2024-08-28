import supabase from '@/lib/supabase/supabase';

export async function GET(request: Request) {
  try {
    // Parse the user ID from the query parameters
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    // Validate the user ID
    if (!userId || typeof userId !== 'string') {
      return new Response(JSON.stringify({ error: 'Invalid or missing userId' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Fetch the user data from Supabase
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    // Handle any errors
    if (error) {
      console.error('Error fetching user data:', error.message);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check if data was returned
    if (!data) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Return the user data as JSON
    return new Response(JSON.stringify({ data }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('Error handling GET request:', err);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function POST(request: Request) {
  // POST logic here...
}

export async function PATCH(request: Request) {
  // PATCH logic here...
}

export async function DELETE(request: Request) {
  // DELETE logic here...
}
