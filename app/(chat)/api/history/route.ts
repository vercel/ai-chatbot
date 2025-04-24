// import { createClient } from '@/lib/supabase/server'; // REMOVE SUPABASE
import { auth } from '@clerk/nextjs/server'; // ADD CLERK
import { db } from '@/lib/db/queries'; // Need DB for profile lookup
import * as schema from '@/lib/db/schema'; // Need schema for profile lookup
import { eq } from 'drizzle-orm'; // Need eq for profile lookup
import { cookies } from 'next/headers';
// Import the Drizzle query function
import { getChatsByUserId, getDocumentsByUserId } from '@/lib/db/queries';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const limit = Number(searchParams.get('limit') || 20);
  // Get the type parameter, default to 'chats'
  const type = searchParams.get('type') || 'chats';

  // --- CLERK AUTH & PROFILE LOOKUP ---
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) {
    console.error('[API /api/history] Unauthorized - No Clerk User ID found');
    // Return Response object for consistency
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
    // Return Response object
    return new Response('User profile not found', { status: 404 });
  }
  const userId = profile.id; // Use the internal profile UUID
  // --- END AUTH ---

  try {
    let responseData: any = { items: [], hasMore: false }; // Default structure

    if (type === 'chats') {
      console.log(`[API /api/history] Fetching type: chats for user ${userId}`);
      const result = await getChatsByUserId({
        id: userId,
        limit,
        startingAfter: null, // Add pagination params later
        endingBefore: null,
      });
      // Adapt to common structure
      responseData = {
        items: result.chats.map((c) => ({ ...c, type: 'chat' })),
        hasMore: result.hasMore,
      };
    } else if (type === 'files') {
      console.log(`[API /api/history] Fetching type: files for user ${userId}`);
      const result = await getDocumentsByUserId({
        id: userId,
        limit,
      });
      // Adapt to common structure
      responseData = {
        items: result.documents.map((d) => ({ ...d, type: 'document' })),
        hasMore: result.hasMore,
      };
    } else if (type === 'all') {
      console.log(`[API /api/history] Fetching type: all for user ${userId}`);
      // Fetch both, limit each slightly more to allow for combination/sorting? Or fetch full page of each?
      // For simplicity now, fetch first page of each and combine/sort
      const [chatResult, docResult] = await Promise.all([
        getChatsByUserId({
          id: userId,
          limit,
          startingAfter: null,
          endingBefore: null,
        }),
        getDocumentsByUserId({ id: userId, limit }),
      ]);

      const combinedItems = [
        ...chatResult.chats.map((c) => ({
          ...c,
          type: 'chat' as const,
          sortDate: new Date(c.createdAt),
          createdAt: c.createdAt,
        })),
        ...docResult.documents.map((d) => ({
          ...d,
          type: 'document' as const,
          sortDate: d.modifiedAt ? new Date(d.modifiedAt) : new Date(0),
          createdAt: d.createdAt,
          modifiedAt: d.modifiedAt,
          chatId: d.chatId,
        })),
      ];

      // Sort combined items by date descending
      combinedItems.sort((a, b) => b.sortDate.getTime() - a.sortDate.getTime());

      // Apply limit AFTER sorting
      const limitedItems = combinedItems.slice(0, limit);
      // Determine hasMore based on if we fetched more than the limit initially (simplification)
      const hasMore =
        chatResult.chats.length + docResult.documents.length > limit;

      responseData = { items: limitedItems, hasMore };
    } else {
      console.warn(`[API /api/history] Unknown type requested: ${type}`);
      return Response.json(
        { error: 'Invalid type parameter' },
        { status: 400 },
      );
    }

    return Response.json(responseData);
  } catch (err: any) {
    console.error(`Error fetching history (type: ${type}):`, err);
    return Response.json(
      { error: 'Error fetching history', details: err.message },
      { status: 500 },
    );
  }
}
