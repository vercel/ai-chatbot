import supabase from '@/lib/supabase/supabase';
import check_missing_fields from '@/lib/api/check_missing_fields';
import create_response from '@/lib/api/create_response';
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const res = await request.json();

    // Check for missing fields: expect 'supabaseId'
    const missing_fields = check_missing_fields({
      fields: ['supabaseId'],
      reqBody: res,
    });

    if (missing_fields) {
      return create_response({
        request,
        data: { missing_fields },
        status: 400,
      });
    }

    const { supabaseId } = res;

    console.log('supabaseId:', supabaseId);

    // Step 1: Fetch subtitles and play speed from the users table
    const { data: userData, error } = await supabase
      .from('users')
      .select('subtitles, playback_speed')
      .eq('id', supabaseId)
      .single();

    // Handle any error or missing user data
    if (error || !userData) {
      console.error('Supabase Error:', error);
      return create_response({
        request,
        data: { error: 'User not found or an error occurred', details: error?.message || null },
        status: 404,
      });
    }

    console.log('User Data:', userData);

    // Return the fetched data
    return create_response({
      request,
      data: {
        subtitles: userData.subtitles,
        play_speed: userData.playback_speed,
      },
      status: 200,
    });
  } catch (err) {
    // Log unexpected errors and return
    console.error('Unexpected Error:', err);
    return create_response({
      request,
      data: { error: 'Internal Server Error', details: err },
      status: 500,
    });
  }
}
