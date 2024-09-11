import supabase from '@/lib/supabase/supabase';
import check_missing_fields from '@/lib/api/check_missing_fields';
import create_response from '@/lib/api/create_response';
import { NextRequest } from 'next/server';

interface Lesson {
  class_id: string;
  topic: string;
  locked: boolean;
  progress: number;
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

    // Step 1: Fetch user's progress to get the user's current level and lesson
    const { data: progressData, error: progressError } = await supabase
      .from('user_progress')
      .select('id, level, current_lesson') // Get the current level and lesson
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
    const userCurrentLevelId = progressData.level; // This is the level ID, not the name
    const userCurrentLesson = progressData.current_lesson; // Get the user's current lesson (e.g., C1.1.1)

    console.log('Fetched user progress ID:', userProgressId);
    console.log('User current level ID:', userCurrentLevelId);
    console.log('User current lesson:', userCurrentLesson);

    // Step 2: Fetch the level name that corresponds to the user's current level ID
    const { data: levelData, error: levelError } = await supabase
      .from('levels')
      .select('name') // Get the name (e.g., 'C1.1') of the current level
      .eq('id', userCurrentLevelId)
      .single();

    if (levelError || !levelData) {
      console.error('Error fetching level name:', levelError);
      return create_response({
        request,
        data: { error: levelError?.message || 'No level found for user' },
        status: 500,
      });
    }

    const userCurrentLevel = levelData.name; // Now we have the level name (e.g., 'C1.1')
    console.log('Fetched user current level name:', userCurrentLevel);

    // Step 3: Fetch all user lessons from user_lessons (we use lesson_id for matching)
    const { data: userLessonsData, error: userLessonsError } = await supabase
      .from('user_lessons')
      .select('lesson_id, progress')
      .eq('user_progress_id', userProgressId);

    if (userLessonsError) {
      console.error('Error fetching user lessons:', userLessonsError);
      return create_response({
        request,
        data: { error: userLessonsError?.message || 'Error fetching user lessons' },
        status: 500,
      });
    }

    console.log('Fetched user lessons:', userLessonsData);

    // Create a map of user's lessons for quick lookup based on lesson_id
    const userLessonsMap: { [lesson_id: string]: { progress: number } } = {};
    userLessonsData.forEach((lesson) => {
      userLessonsMap[lesson.lesson_id] = { progress: lesson.progress };
    });

    // Step 4: Define the correct order of levels
    const levelOrder = ['A1.1', 'A1.2', 'A2.1', 'A2.2', 'B1.1', 'B1.2', 'B2.1', 'B2.2', 'C1.1', 'C1.2', 'C2.1', 'C2.2'];

    // Step 5: Fetch all lessons from lesson_plan (we use the id for matching with lesson_id in user_lessons)
    const { data: lessonPlanData, error: lessonPlanError } = await supabase
      .from('lesson_plan')
      .select('id, class_id, topic'); // Include 'id' for matching with user_lessons.lesson_id

    if (lessonPlanError || !lessonPlanData) {
      console.error('Error fetching lesson plan data:', lessonPlanError);
      return create_response({
        request,
        data: { error: lessonPlanError?.message || 'No lessons found' },
        status: 500,
      });
    }

    console.log('Fetched lesson plan data:', lessonPlanData);

    // Step 6: Construct dictionary of lessons by level with user's progress and unlock status based on their level
    const levelDictionary: LevelDictionary = {};

    // Initialize levels with empty arrays
    levelOrder.forEach((level) => {
      levelDictionary[level] = [];
    });

    // Populate lessons under their respective levels, with lock/progress status based on user data and level comparison
    lessonPlanData.forEach((lesson) => {
      console.log('Processing lesson:', lesson.class_id);
      const levelPrefix = lesson.class_id.split('.').slice(0, 2).join('.'); // Extract level prefix like 'A1.1'
      const userLesson = userLessonsMap[lesson.id]; // Match by 'id' from lesson_plan and 'lesson_id' from user_lessons

      let locked = true; // Default locked status

      // Log the current lesson and its level
      console.log(`Processing lesson: ${lesson.class_id}, level: ${levelPrefix}`);
      console.log("User Current level", userCurrentLevel);

      // Unlock all lessons before the user's current level
      if (levelOrder.indexOf(levelPrefix) < levelOrder.indexOf(userCurrentLevel)) {
        locked = false;
        console.log(`Unlocked (before user's current level): ${lesson.class_id}`);
      }

      // From the user's current level onwards, unlock based on user_lessons
      if (levelPrefix >= userCurrentLevel) {
        locked = !userLesson; // Only unlock if there is an entry in userLessons
        console.log(`Checked user_lessons for ${lesson.class_id}, locked: ${locked}`);
      }

      // Log whether the lesson is locked or unlocked
      console.log(`Final locked status for lesson ${lesson.class_id}: ${locked}`);

      // Push the lesson into the appropriate level in the dictionary
      levelDictionary[levelPrefix]?.push({
        class_id: lesson.class_id,
        topic: lesson.topic,
        locked: userLesson ? false : locked, // If the lesson is in userLessons, unlock it
        progress: userLesson ? userLesson.progress : 0, // Use progress from user's lesson, or 0 if locked
      });
    });

    // Return the constructed dictionary with user-specific data
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
