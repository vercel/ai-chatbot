import supabase from '@/lib/supabase/supabase';
import check_missing_fields from '@/lib/api/check_missing_fields';
import create_response from '@/lib/api/create_response';
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('Request received:', request.method);

    const res = await request.json();
    console.log('Parsed request body:', res);

    // Check for missing fields
    const missing_fields = check_missing_fields({
      fields: ['supabase_id'],
      reqBody: res,
    });

    if (missing_fields) {
      console.log('Missing fields:', missing_fields);
      return create_response({
        request,
        data: { missing_fields },
        status: 400,
      });
    }

    const { supabase_id } = res;
    console.log('Supabase ID:', supabase_id);

    // Query the database for user progress (first query)
    const { data: progressData, error: progressError } = await supabase
      .from('user_progress')
      .select(`
        id,
        progress,
        level,
        current_lesson
      `)
      .eq('user_id', supabase_id) // Filter by supabase_id
      .single();

    if (progressError || !progressData) {
      console.error('Error fetching user progress data:', progressError);
      return create_response({
        request,
        data: { error: progressError?.message || 'No data found' },
        status: 500,
      });
    }

    const levelId = progressData?.level;
    console.log('Fetched level ID:', levelId);

    // Query the levels table for the name of the level (second query)
    const { data: levelData, error: levelError } = await supabase
      .from('levels')
      .select('name')
      .eq('id', levelId)
      .single();

    if (levelError || !levelData) {
      console.error('Error fetching level data:', levelError);
      return create_response({
        request,
        data: { error: levelError?.message || 'No level data found' },
        status: 500,
      });
    }

    const levelName = levelData?.name || 'Unknown';
    console.log('Fetched level name:', levelName);

    // Query the number of classes taken
    const { data: classesTakenData, error: classesTakenError } = await supabase
      .from('user_lessons')
      .select('id')
      .eq('user_progress_id', progressData.id)
      .gt('progress', 50); // Progress greater than 50%

    const classes_taken = classesTakenData ? classesTakenData.length : 0;

    // Query the total number of classes in the current level using the correct prefix
    const levelPrefix = levelName.split('.').slice(0, 2).join('.'); // Extract level prefix like 'C1.1'

    const { data: totalClassesData, error: totalClassesError } = await supabase
      .from('lesson_plan')
      .select('id')
      .like('class_id', `${levelPrefix}%`); // Match the class_id prefix

    const total_classes = totalClassesData ? totalClassesData.length : 0;

    if (classesTakenError || totalClassesError) {
      console.error('Error fetching class data:', classesTakenError, totalClassesError);
      return create_response({
        request,
        data: {
          error: 'Error fetching class data',
        },
        status: 500,
      });
    }

    // Create the response format
    const response = {
      progress: progressData?.progress || 0,
      level: levelName,
      current_lesson: progressData?.current_lesson || null, // Add current lesson ID
      classes_taken,
      total_classes,
      message: `${classes_taken}/${total_classes} ${levelName} classes completed`,
    };

    console.log('Final response:', response);

    // Return the retrieved user progress data
    return create_response({
      request,
      data: { response },
      status: 200,
    });
  } catch (err) {
    console.error('Unexpected error:', err);
    return create_response({
      request,
      data: { error: 'Internal Server Error', details: err },
      status: 500,
    });
  }
}
