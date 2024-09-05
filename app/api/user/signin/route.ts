import supabase from '@/lib/supabase/supabase';
import create_response from '@/lib/api/create_response';
import check_missing_fields from '@/lib/api/check_missing_fields';
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const res = await request.json();

    // Check for missing fields
    const missing_fields = check_missing_fields({
      fields: ['email'],
      reqBody: res,
    });

    if (missing_fields) {
      return create_response({
        request,
        data: { missing_fields },
        status: 400,
      });
    }

    const { email } = res;

    console.log("email", email);

    // Check if the user exists by email
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    // Respond with 200 but different messages depending on the result
    if (error || !data) {
      return create_response({
        request,
        data: { message: 'User not found', userExists: false },
        status: 200, // Always return 200
      });
    }

    // User exists, return success
    return create_response({
      request,
      data: { message: 'User exists', userExists: true, userId: data.id },
      status: 200,
    });
  } catch (err) {
    console.error('Error handling POST request:', err);
    return create_response({
      request,
      data: { error: 'Internal Server Error' },
      status: 500,
    });
  }
}
