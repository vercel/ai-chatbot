import supabase from '@/lib/supabase/supabase';
import check_missing_fields from '@/lib/api/check_missing_fields';
import create_response from '@/lib/api/create_response';
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const res = await request.json();

    // Check if lessonId is provided
    const missing_fields = check_missing_fields({
      fields: ['lessonId'],
      reqBody: res,
    });

    if (missing_fields) {
      return create_response({
        request,
        data: { missing_fields },
        status: 400,
      });
    }

    const { lessonId } = res;

    // Fetch lesson_id from user_lessons
    const { data: userLessonData, error: userLessonError } = await supabase
      .from('user_lessons')
      .select('lesson_id')
      .eq('id', lessonId)
      .single();

    if (userLessonError || !userLessonData) {
      return create_response({
        request,
        data: { error: 'Lesson not found in user_lessons' },
        status: 404,
      });
    }

    const lessonIdFromUserLesson = userLessonData.lesson_id;

    // Fetch class_id from lesson_plan using lesson_id
    const { data: lessonPlanData, error: lessonPlanError } = await supabase
      .from('lesson_plan')
      .select('class_id')
      .eq('id', lessonIdFromUserLesson)
      .single();

    if (lessonPlanError || !lessonPlanData) {
      return create_response({
        request,
        data: { error: 'Lesson not found in lesson_plan' },
        status: 404,
      });
    }

    const classId = lessonPlanData.class_id;

    return create_response({
      request,
      data: { classId },
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
