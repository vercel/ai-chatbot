import supabase from '@/lib/supabase/supabase';

export async function POST(request: Request) {
  try {
    const { userId } = await request.json();

    if (!userId || typeof userId !== 'string') {
      return new Response(JSON.stringify({ error: 'Invalid userId' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log("userId", userId);  

    const { data, error } = await supabase
      .from('users')
      .select('subscription, plan_type, billing_date, auth_method')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching user subscription:', error.message);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!data) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ data }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
