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
      fields: ['supabase_id', 'class_id', 'start_from_beginning'],
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

    const { supabase_id, class_id, start_from_beginning } = res;
    console.log('Supabase ID:', supabase_id);
    console.log('Class ID:', class_id);

    // Step 1: Fetch user's progress to get the user_progress_id
    const { data: progressData, error: progressError } = await supabase
      .from('user_progress')
      .select('id')
      .eq('user_id', supabase_id)
      .single();

    if (progressError || !progressData) {
      console.error('Error fetching user progress:', progressError);
      return create_response({
        request,
        data: { error: progressError?.message || 'No progress found for user' },
        status: 500,
      });
    }

    const userProgressId = progressData.id;
    console.log('Fetched user progress ID:', userProgressId);

    // Step 2: Fetch the lesson from lesson_plan using the class_id
    const { data: lessonPlanData, error: lessonPlanError } = await supabase
      .from('lesson_plan')
      .select('id')
      .eq('class_id', class_id)
      .single();

    if (lessonPlanError || !lessonPlanData) {
      console.error('Error fetching lesson plan data:', lessonPlanError);
      return create_response({
        request,
        data: { error: lessonPlanError?.message || 'Lesson not found' },
        status: 500,
      });
    }

    const lessonPlanId = lessonPlanData.id;
    console.log('Fetched lesson plan ID:', lessonPlanId);

    // Step 3: Check if the user has already started this lesson
    const { data: userLessonData, error: userLessonError } = await supabase
      .from('user_lessons')
      .select('id, progress')
      .eq('user_progress_id', userProgressId)
      .eq('lesson_id', lessonPlanId)
      .single();

    // If lesson exists, return the lesson_id
    if (userLessonData) {
      const progress = start_from_beginning ? 0 : userLessonData.progress;

      // If starting from beginning, update progress to 0
      if (start_from_beginning && userLessonData.progress !== 0) {
        const { error: updateError } = await supabase
          .from('user_lessons')
          .update({ progress: 0 })
          .eq('id', userLessonData.id);

        if (updateError) {
          console.error('Error updating progress to 0:', updateError);
          return create_response({
            request,
            data: { error: updateError?.message || 'Failed to reset progress' },
            status: 500,
          });
        }

        console.log('Progress reset to 0 for lesson:', lessonPlanId);
      }

      return create_response({
        request,
        data: { lesson_id: lessonPlanId, progress },
        status: 200,
      });
    }

    // Step 4: If lesson does not exist, create a new one
    const { data: newLessonData, error: newLessonError } = await supabase
      .from('user_lessons')
      .insert({
        user_progress_id: userProgressId,
        lesson_id: lessonPlanId,
        progress: start_from_beginning ? 0 : 1,
      })
      .select()
      .single();

    if (newLessonError) {
      console.error('Error inserting new lesson:', newLessonError);
      return create_response({
        request,
        data: { error: newLessonError?.message || 'Failed to create new lesson' },
        status: 500,
      });
    }

    console.log('New lesson created:', newLessonData);

    return create_response({
      request,
      data: { lesson_id: newLessonData.lesson_id, progress: newLessonData.progress },
      status: 200,
    });
  } catch (err) {
    console.error('Unexpected error:', err);
    return create_response({
      request,
      data: { error: 'Internal Server Error', details: (err as Error).message },
      status: 500,
    });
  }
}
