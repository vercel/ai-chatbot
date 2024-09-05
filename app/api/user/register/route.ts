import supabase from '@/lib/supabase/supabase';
import create_response from '@/lib/api/create_response';
import check_missing_fields from '@/lib/api/check_missing_fields';
import { NextRequest } from 'next/server';

// Define a type for the expected request body
type UserData = {
  firebaseUid: string;
  name: string;
  last_name: string;
  email: string;
  phone_number?: string;
  auth_method: string;
};

export async function POST(request: NextRequest) {
  try {
    const res: UserData = await request.json();

    // Check for missing fields
    const missing_fields = check_missing_fields({
      fields: ['firebaseUid', 'name', 'last_name', 'email', 'auth_method'],
      reqBody: res,
    });

    if (missing_fields) {
      return create_response({
        request,
        data: { missing_fields },
        status: 400,
      });
    }

    const { firebaseUid, name, last_name, email, phone_number, auth_method } = res;

    // Check if the user already exists by Firebase UID, and retrieve all necessary fields
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id, name, last_name, email, phone_number, auth_method') // Select all necessary fields
      .eq('firebase_id', firebaseUid)
      .single();

    if (existingUser) {
      // User already exists, update their information (but don't overwrite existing values)
      const { error: updateError } = await supabase
        .from('users')
        .update({
          name: existingUser.name || name,
          last_name: existingUser.last_name || last_name,
          email: existingUser.email || email,
          phone_number: existingUser.phone_number || phone_number,
          auth_method: existingUser.auth_method || auth_method,
        })
        .eq('firebase_id', firebaseUid);

      if (updateError) {
        return create_response({
          request,
          data: { error: updateError.message },
          status: 500,
        });
      }

      return create_response({
        request,
        data: { message: 'User data updated successfully' },
        status: 200,
      });
    }

    if (checkError && checkError.code !== 'PGRST116') {
      // Return an error if it's not the 'not found' error code
      return create_response({
        request,
        data: { error: 'Error checking for user existence' },
        status: 500,
      });
    }

    // Register new user
    const { error: insertError } = await supabase.from('users').insert([
      {
        firebase_id: firebaseUid,
        name,
        last_name,
        email,
        phone_number,
        auth_method,
      },
    ]);

    if (insertError) {
      return create_response({
        request,
        data: { error: insertError.message },
        status: 500,
      });
    }

    return create_response({
      request,
      data: { message: 'User registered successfully' },
      status: 201,
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
