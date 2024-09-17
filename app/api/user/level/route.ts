import supabase from '@/lib/supabase/supabase'
import check_missing_fields from '@/lib/api/check_missing_fields'
import create_response from '@/lib/api/create_response'
import { NextRequest } from 'next/server'

// Define a map of level names to their respective UUIDs
const levelMap: { [key: string]: string } = {
  "A1.1": "727c2104-32c6-48a0-8d23-6d56e46ea4ce",
  "A1.2": "1cdb8746-b48b-42e2-b06f-c951a2c1d8ee",
  "A2.1": "7d7ab92b-5a92-4506-bbf6-a3c32ca0161b",
  "A2.2": "4df272bf-61de-4c6b-b964-4342fe4082d9",
  "B1.1": "24a1b964-a2c6-4a37-96be-4b9fa2022b08",
  "B1.2": "2d476b4e-526c-4af9-bc97-f2f82ff79309",
  "B2.1": "de137800-2b4e-4608-bc3c-69a4b2da4372",
  "B2.2": "f674a417-592d-4053-828a-75f422c2b79c",
  "C1.1": "863cf31e-391a-43ea-bd54-ffea9a4bb08e",
  "C1.2": "57440051-51cb-4ded-acb0-b0ce41907d11",
  "C2.1": "5c613544-f878-45f9-bc94-c8e007da5df8",
  "C2.2": "150ca249-343e-4af7-93d5-1aac5c853995"
};

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const res = await request.json();

    // Check for missing fields: expect 'supabaseId' and 'level'
    const missing_fields = check_missing_fields({
      fields: ['supabaseId', 'level'],
      reqBody: res
    });

    if (missing_fields) {
      return create_response({
        request,
        data: { missing_fields },
        status: 400
      });
    }

    const { supabaseId, level } = res;

    console.log('supabaseId:', supabaseId);
    console.log('level:', level);

    // Validate if the passed level exists in the levelMap
    if (!(level in levelMap)) {
      console.error(`Invalid level passed: ${level}`);
      return create_response({
        request,
        data: { error: `Invalid level. Accepted levels are: ${Object.keys(levelMap).join(', ')}` },
        status: 400
      });
    }

    // Retrieve the corresponding UUID for the level
    const levelId = levelMap[level];

    // Step 1: Check if a record exists for the user
    const { data: existingUser, error: checkError } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', supabaseId)
      .single();

    if (checkError || !existingUser) {
      console.error(`No user progress found for supabaseId: ${supabaseId}`);
      return create_response({
        request,
        data: { error: `No user progress found for supabaseId: ${supabaseId}` },
        status: 404
      });
    }

    console.log('Existing User Progress:', existingUser);

    // Step 2: Now update the 'level' for the user
    const { data, error } = await supabase
      .from('user_progress')
      .update({ level: levelId }) // Update the 'level' column with the new level UUID
      .eq('user_id', supabaseId);

    // If there is an error, log the error message and details
    if (error) {
      console.error('Supabase Error:', error);
      return create_response({
        request,
        data: { error: error.message, details: error.details || null },
        status: 500
      });
    }

    console.log('Supabase data:', data);

    // Return success message after update
    return create_response({
      request,
      data: { message: 'User progress updated successfully', data },
      status: 200
    });
  } catch (err) {
    // Log unexpected errors and return
    console.error('Unexpected Error:', err);
    return create_response({
      request,
      data: { error: 'Internal Server Error', details: err },
      status: 500
    });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return create_response({
        request,
        data: { error: 'User ID is required' },
        status: 400,
      });
    }

    // Step 1: Fetch the user's current level ID from user_progress
    const { data: userProgress, error: progressError } = await supabase
      .from('user_progress')
      .select('level')
      .eq('user_id', userId)
      .single();

    if (progressError || !userProgress) {
      return create_response({
        request,
        data: { error: 'User progress not found' },
        status: 404,
      });
    }

    console.log('User progress:', userProgress);

    const levelId = userProgress.level;
    console.log('Level ID:', levelId);

    // Step 2: Use the level ID to fetch the name from the levels table
    const { data: levelData, error: levelError } = await supabase
      .from('levels')
      .select('name')
      .eq('id', levelId)
      .single();

    if (levelError || !levelData) {
      return create_response({
        request,
        data: { error: 'Level not found' },
        status: 404,
      });
    }

    console.log(levelData, "levelData");

    // Step 3: Return the level name
    return create_response({
      request,
      data: { levelName: levelData.name },
      status: 200,
    });
  } catch (err) {
    return create_response({
      request,
      data: { error: 'Internal Server Error', details: (err as Error).message },
      status: 500,
    });
  }
}
