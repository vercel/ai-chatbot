import supabase from '@/lib/supabase/supabase';
import check_missing_fields from '@/lib/api/check_missing_fields';
import create_response from '@/lib/api/create_response';
import { NextRequest } from 'next/server';

export async function PUT(request: NextRequest) {
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

    const { supabaseId, playback_speed, subtitles } = res;

    // Prepare the fields to be updated
    const updates: any = {};
    if (playback_speed !== undefined) updates.playback_speed = playback_speed;
    if (subtitles !== undefined) updates.subtitles = subtitles;

    // Perform the update in the users table
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', supabaseId);

    if (error) {
      console.error('Supabase Error:', error);
      return create_response({
        request,
        data: { error: error.message, details: error.details || null },
        status: 500,
      });
    }

    // Return success response after the update
    return create_response({
      request,
      data: { message: 'User settings updated successfully', data },
      status: 200,
    });
  } catch (err) {
    console.error('Unexpected Error:', err);
    return create_response({
      request,
      data: { error: 'Internal Server Error', details: err },
      status: 500,
    });
  }
}
