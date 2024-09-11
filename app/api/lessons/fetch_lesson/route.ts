import supabase from '@/lib/supabase/supabase';
import check_missing_fields from '@/lib/api/check_missing_fields';
import create_response from '@/lib/api/create_response';
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Log incoming request
    console.log('Incoming request:', request);

    const res = await request.json();
    console.log('Request JSON parsed:', res);

    // Check for missing fields
    const missing_fields = check_missing_fields({
      fields: ['class_id', 'type', 'user_id'],
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

    const { class_id, type, user_id, topics = [], message: userMessage = '' } = res;
    console.log('Destructured request data:', { class_id, type, user_id, topics, userMessage });

    let system_prompt = '';
    let lesson_data = {};
    let current_lesson = '';

    // Fetch the user_progress_id based on the user_id
    const { data: userProgress, error: userProgressError } = await supabase
      .from('user_progress')
      .select('id')
      .eq('user_id', user_id)
      .single();

    if (userProgressError) {
      console.error('Error fetching user_progress:', userProgressError);
      return create_response({
        request,
        data: { error: userProgressError.message },
        status: 500,
      });
    }

    console.log('Fetched user progress:', userProgress);
    const user_progress_id = userProgress.id;

    if (type === 'lesson_plan') {
      // Use class_id directly as lesson_id
      const lesson_id = class_id;

      // Fetch the lesson details from the lesson_plan table using the class_id
      const { data: lessonDataResponse, error: lessonError } = await supabase
        .from('lesson_plan')
        .select(`
          session_sequence,
          topic,
          learning_experiences,
          learning_results,
          duration,
          category
        `)
        .eq('id', lesson_id)  // Directly using class_id as lesson_id
        .single();

      if (lessonError) {
        console.error('Error fetching lesson_plan:', lessonError);
        return create_response({
          request,
          data: { error: lessonError.message },
          status: 500,
        });
      }

      console.log('Fetched lesson plan details:', lessonDataResponse);

      // Extract fields from lessonDataResponse
      const {
        session_sequence,
        topic,
        learning_experiences,
        learning_results,
        duration,
        category,
      } = lessonDataResponse || {};

      // Query the lesson_types table to get the name of the lesson type
      const { data: lessonTypeResponse, error: lessonTypeError } = await supabase
        .from('lesson_types')
        .select('name')
        .eq('id', category)
        .single();

      if (lessonTypeError) {
        console.error('Error fetching lesson_types:', lessonTypeError);
        return create_response({
          request,
          data: { error: lessonTypeError.message },
          status: 500,
        });
      }

      console.log('Fetched lesson type:', lessonTypeResponse);
      const { name: lessonTypeName } = lessonTypeResponse;

      // Construct lesson_data object
      lesson_data = {
        session_sequence,
        topic,
        learning_experiences,
        learning_results,
        duration,
        lesson_type: lessonTypeName,
        type,
      };
      console.log('Constructed lesson_data:', lesson_data);

      // Query the user_progress table to get the current lesson for the user
      const { data: lesson, error: current_lesson_error } = await supabase
        .from('user_progress')
        .select('current_lesson')
        .eq('id', user_progress_id)
        .single();

      if (current_lesson_error) {
        console.error('Error fetching current lesson:', current_lesson_error);
        return create_response({
          request,
          data: { error: current_lesson_error.message },
          status: 500,
        });
      }

      current_lesson = lesson?.current_lesson || '';
      console.log('Fetched current lesson:', current_lesson);

    } else if (type === 'free') {
      // Handle "free" type, returning topics
      lesson_data = {
        type,
        topics,
      };
      console.log('Constructed lesson_data for "free" type:', lesson_data);

      // Insert the new entry into the user_lessons table
      const { data: insertData, error: insertError } = await supabase
        .from('user_lessons')
        .insert([{ user_progress_id, type, topics }])
        .select('id')
        .single();

      if (insertError) {
        console.error('Error inserting into user_lessons:', insertError);
        return create_response({
          request,
          data: { error: insertError.message },
          status: 500,
        });
      }

      // Set current_lesson to the ID of the newly created lesson
      current_lesson = insertData?.id || null;
      console.log('Inserted new lesson, current_lesson:', current_lesson);
    }

    // Log the final response before returning it
    console.log('Final response data:', { lesson_data, current_lesson });
    return create_response({
      request,
      data: { lesson_data, current_lesson },
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
