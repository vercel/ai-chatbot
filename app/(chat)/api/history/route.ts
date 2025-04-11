import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

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
    // Database query (we know this needs fixing later, but leave as is for now)
    const { data: chats, error } = await supabase
      .from('chats')
      .select('id, payload') // Select the potentially incorrect column for now
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching chat history:', error);
      // Keep the specific error logging for the DB query
      return Response.json(
        { error: 'Error fetching history', details: error.message },
        { status: 500 },
      );
    }

    return Response.json(chats || []);
  } catch (err: any) {
    console.error('Unexpected error in /api/history:', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
