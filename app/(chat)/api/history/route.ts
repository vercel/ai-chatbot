// import { createClient } from '@/lib/supabase/server'; // REMOVE SUPABASE
import { auth } from '@clerk/nextjs/server'; // ADD CLERK
// REMOVED: import { db } from '@/lib/db/queries'; // Need DB for profile lookup
import * as schema from '@/lib/db/schema'; // Need schema for profile lookup
import { eq } from 'drizzle-orm'; // Need eq for profile lookup
// REMOVE: import { cookies } from 'next/headers';
import { NextRequest } from 'next/server'; // Use NextRequest
// Import the Drizzle query function
import {
  db, // Already consolidated here
  getChatsByUserId,
  // REMOVE: getDocumentsByUserId,
} from '@/lib/db/queries';
// import type { HistoryPage } from '@/components/app-sidebar'; // Import response type if needed
// Use an inline type or define locally if HistoryPage is simple
interface HistoryPage {
  items: any[]; // Replace 'any' with the actual chat type from schema if possible
  hasMore: boolean;
}

export async function GET(req: NextRequest) {
  // Use NextRequest
  const { searchParams } = req.nextUrl; // Use req.nextUrl
  const limit = Number(searchParams.get('limit') || 20);
  // REMOVE: const type = searchParams.get('type') || 'chats';
  // ADD pagination parameters
  const startingAfter = searchParams.get('starting_after');
  const endingBefore = searchParams.get('ending_before');

  if (startingAfter && endingBefore) {
    return Response.json(
      { error: 'Only one of starting_after or ending_before can be provided!' },
      { status: 400 },
    );
  }

  // --- CLERK AUTH & PROFILE LOOKUP (Keep this block) ---
  const { userId: clerkUserId } = await auth(); // Use existing auth call
  if (!clerkUserId) {
    console.error('[API /api/history] Unauthorized - No Clerk User ID found');
    return new Response('Unauthorized', { status: 401 });
  }

  const profile = await db.query.userProfiles.findFirst({
    columns: { id: true },
    where: eq(schema.userProfiles.clerkId, clerkUserId),
  });

  if (!profile) {
    console.error(
      `[API /api/history] User profile not found for Clerk ID: ${clerkUserId}`,
    );
    return Response.json(
      { items: [], hasMore: false, error: 'User profile not found' },
      { status: 404 },
    );
  }
  const userId = profile.id;
  // --- END AUTH ---

  try {
    // Directly fetch chats using parsed pagination parameters
    console.log(
      `[API /api/history] Fetching chats for user ${userId} with limit: ${limit}, startingAfter: ${startingAfter}, endingBefore: ${endingBefore}`,
    );
    const result = await getChatsByUserId({
      id: userId,
      limit,
      startingAfter: startingAfter, // Pass parsed param
      endingBefore: endingBefore, // Pass parsed param
    });

    // Ensure the response matches the expected { items, hasMore } structure
    // Assuming getChatsByUserId already returns { chats: [], hasMore: boolean }
    const responseData: HistoryPage = {
      items: result.chats, // Use result.chats directly
      hasMore: result.hasMore,
    };

    // REMOVE type checking logic (files, all)

    return Response.json(responseData);
  } catch (err: any) {
    console.error(`Error fetching chat history:`, err);
    return Response.json(
      { error: 'Error fetching history', details: err.message },
      { status: 500 },
    );
  }
}
