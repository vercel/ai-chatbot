import supabase from '@/lib/supabase/supabase';
import check_missing_fields from '@/lib/api/check_missing_fields';
import create_response from '@/lib/api/create_response';
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('Request received:', request.method);

    const res = await request.json();
    console.log('Parsed request body:', res);

    // Check if lessonId is provided
    const missing_fields = check_missing_fields({
      fields: ['lessonId'],
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

    const { lessonId } = res;
    console.log('Lesson ID:', lessonId);

    // Fetch class_id directly from lesson_plan using the provided lessonId
    const { data: lessonPlanData, error: lessonPlanError } = await supabase
      .from('lesson_plan')
      .select('class_id')
      .eq('id', lessonId)
      .single();

    if (lessonPlanError || !lessonPlanData) {
      console.error('Error fetching from lesson_plan:', lessonPlanError);
      return create_response({
        request,
        data: { error: 'Lesson not found in lesson_plan' },
        status: 404,
      });
    }

    console.log('Lesson Plan Data:', lessonPlanData);
    const classId = lessonPlanData.class_id;
    console.log('Class ID from lesson_plan:', classId);

    // Return the classId to the client
    return create_response({
      request,
      data: { classId },
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
