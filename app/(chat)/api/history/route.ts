import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
// Import the Drizzle query function
import { getChatsByUserId } from '@/lib/db/queries';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const limit = Number(searchParams.get('limit') || 20);

  const supabase = await createClient(); // Use the Supabase client

  // Get user session using Supabase
  const {
    data: { user }, // Destructure user directly
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    // Check for error or missing user
    return Response.json('Unauthorized!', { status: 401 });
  }

  const userId = user.id; // Get user ID

  try {
    // Use the Drizzle query function instead of direct Supabase query
    const result = await getChatsByUserId({
      id: userId,
      limit,
      startingAfter: null, // Add pagination params (can be enhanced later)
      endingBefore: null,
    });

    // Check if the query function returned an error (it throws, so catch block handles it)
    // The function returns an object { chats: Array<Chat>, hasMore: boolean }
    // Return the full result object, not just the chats array
    return Response.json(result);
  } catch (err: any) {
    console.error('Error fetching chat history:', err); // Log the actual error
    return Response.json(
      { error: 'Error fetching history', details: err.message },
      { status: 500 },
    );
  }
}
