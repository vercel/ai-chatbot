import supabase from '@/lib/supabase/supabase';
import check_missing_fields from '@/lib/api/check_missing_fields';
import create_response from '@/lib/api/create_response';
import { NextRequest } from 'next/server';

interface Lesson {
  class_id: string;
  topic: string;
}

interface LevelDictionary {
  [level: string]: Lesson[]; // Maps level names like A1.1, B1.1, etc., to an array of lessons
}

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

    // Step 1: Fetch all levels
    const { data: levelsData, error: levelsError } = await supabase
      .from('levels')
      .select('id, name'); // Selecting the level names and their IDs

    if (levelsError || !levelsData) {
      console.error('Error fetching levels:', levelsError);
      return create_response({
        request,
        data: { error: levelsError?.message || 'No levels found' },
        status: 500, 
      });
    }

    console.log('Fetched levels:', levelsData);

    // Step 2: Fetch all lessons from lesson_plan
    const { data: lessonPlanData, error: lessonPlanError } = await supabase
      .from('lesson_plan')
      .select('class_id, topic'); // Selecting class_id and topic

    if (lessonPlanError || !lessonPlanData) {
      console.error('Error fetching lesson plan data:', lessonPlanError);
      return create_response({
        request,
        data: { error: lessonPlanError?.message || 'No lessons found' },
        status: 500,
      });
    }

    console.log('Fetched lesson plan data:', lessonPlanData);

    // Step 3: Construct dictionary of lessons by level
    const levelDictionary: LevelDictionary = {};

    // Initialize levels with empty arrays
    levelsData.forEach((level) => {
      levelDictionary[level.name] = [];
    });

    // Populate lessons under their respective levels
    lessonPlanData.forEach((lesson) => {
      const levelPrefix = lesson.class_id.split('.').slice(0, 2).join('.'); // Extract level prefix like 'A1.1'
      if (levelDictionary[levelPrefix]) {
        levelDictionary[levelPrefix].push({
          class_id: lesson.class_id,
          topic: lesson.topic,
        });
      }
    });

    console.log('Constructed level dictionary:', levelDictionary);

    // Return the constructed dictionary
    return create_response({
      request,
      data: levelDictionary,
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
