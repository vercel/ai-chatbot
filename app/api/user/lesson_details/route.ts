import supabase from '@/lib/supabase/supabase';
import check_missing_fields from '@/lib/api/check_missing_fields';
import create_response from '@/lib/api/create_response';
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('Request received:', request.method);

    const res = await request.json();
    console.log('Parsed request body:', res);

    // Check if lessonId and userId are provided
    const missing_fields = check_missing_fields({
      fields: ['lessonId', 'userId'],
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

    const { lessonId, userId } = res;
    console.log('Lesson ID:', lessonId);
    console.log('User ID:', userId);

    // Fetch user_progress_id from user_progress using user_id
    const { data: userProgressData, error: userProgressError } = await supabase
      .from('user_progress')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (userProgressError || !userProgressData) {
      console.error('Error fetching user_progress:', userProgressError);
      return create_response({
        request,
        data: { error: 'User progress not found' },
        status: 404,
      });
    }

    const userProgressId = userProgressData.id;

    // Fetch the progress from user_lessons using user_progress_id and lesson_id
    const { data: userLessonData, error: userLessonError } = await supabase
      .from('user_lessons')
      .select('progress')
      .eq('user_progress_id', userProgressId)
      .eq('lesson_id', lessonId)
      .single();

    if (userLessonError || !userLessonData) {
      console.error('Error fetching user_lessons:', userLessonError);
      return create_response({
        request,
        data: { error: 'Lesson not found in user lessons' },
        status: 404,
      });
    }

    const progress = userLessonData.progress;

    // Fetch topic and emoji from lesson_plan using lesson_id
    const { data: lessonPlanData, error: lessonPlanError } = await supabase
      .from('lesson_plan')
      .select('topic, emoji')
      .eq('id', lessonId)
      .single();

    if (lessonPlanError || !lessonPlanData) {
      console.error('Error fetching lesson_plan:', lessonPlanError);
      return create_response({
        request,
        data: { error: 'Lesson not found in lesson plan' },
        status: 404,
      });
    }

    const { topic, emoji } = lessonPlanData;

    // Return the progress, topic, and emoji
    return create_response({
      request,
      data: {
        progress,
        topic,
        emoji,
      },
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
