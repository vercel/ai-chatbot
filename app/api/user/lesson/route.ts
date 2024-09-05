import supabase from '@/lib/supabase/supabase';
import check_missing_fields from '@/lib/api/check_missing_fields';
import create_response from '@/lib/api/create_response';
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const res = await request.json();

    // Check for missing fields
    const missing_fields = check_missing_fields({
      fields: ['class_id', 'type', 'user_id'],
      reqBody: res,
    });

    if (missing_fields) {
      return create_response({
        request,
        data: { missing_fields },
        status: 400,
      });
    }

    const { class_id, type, user_id, topics = [], message: userMessage = '' } = res;

    let system_prompt = '';
    let lesson_data = {};
    let current_lesson = '';

    // Fetch the user_progress_id based on the user_id
    const { data: userProgress, error: userProgressError } = await supabase
      .from('user_progress')
      .select('id')
      .eq('user', user_id)
      .single();

    if (userProgressError) {
      return create_response({
        request,
        data: { error: userProgressError.message },
        status: 500,
      });
    }

    const user_progress_id = userProgress.id;

    if (type === 'lesson_plan') {
      // Query the lesson_plan table
      const { data: lesson_dataResponse, error: lessonError } = await supabase
        .from('lesson_plan')
        .select(`
          session_sequence,
          topic, 
          learning_experiences,
          learning_results,
          duration, 
          category
        `)
        .eq('class_id', class_id)
        .single();

      if (lessonError) {
        return create_response({
          request,
          data: { error: lessonError.message },
          status: 500,
        });
      }

      // Extract fields from lesson_dataResponse
      const {
        session_sequence,
        topic,
        learning_experiences,
        learning_results,
        duration,
        category,
      } = lesson_dataResponse || {};

      // Query the lesson_types table to get the name of the lesson type
      const { data: lessonTypeResponse, error: lessonTypeError } = await supabase
        .from('lesson_types')
        .select('name')
        .eq('id', category)
        .single();

      if (lessonTypeError) {
        return create_response({
          request,
          data: { error: lessonTypeError.message },
          status: 500,
        });
      }

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

      // Query the user_progress table to get the current lesson for the user
      const { data: lesson, error: current_lesson_error } = await supabase
        .from('user_progress')
        .select('current_lesson')
        .eq('id', user_progress_id)
        .single();

      if (current_lesson_error) {
        return create_response({
          request,
          data: { error: current_lesson_error.message },
          status: 500,
        });
      }

      current_lesson = lesson?.current_lesson || '';

    } else if (type === 'free') {
      // Handle "free" type, returning topics
      lesson_data = {
        type,
        topics,
      };

      // Insert the new entry into the user_lessons table
      const { data: insertData, error: insertError } = await supabase
        .from('user_lessons')
        .insert([{ user_progress_id, type, topics }])
        .select('id')
        .single();

      if (insertError) {
        return create_response({
          request,
          data: { error: insertError.message },
          status: 500,
        });
      }

      // Set current_lesson to the ID of the newly created lesson
      current_lesson = insertData?.id || null;
    }

    // Return lesson_data and current_lesson in the API response
    return create_response({
      request,
      data: { lesson_data, current_lesson },
      status: 200,
    });

  } catch (err) {
    // Handle unexpected errors
    return create_response({
      request,
      data: { error: 'Internal Server Error', details: err },
      status: 500,
    });
  }
}
