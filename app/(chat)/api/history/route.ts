// import { createClient } from '@/lib/supabase/server'; // REMOVE SUPABASE
import { auth, clerkClient } from '@clerk/nextjs/server'; // Keep Clerk auth and import clerkClient
// REMOVED: import { db } from '@/lib/db/queries'; // Need DB for profile lookup
// REMOVED: import * as schema from '@/lib/db/schema'; // Need schema for profile lookup
// REMOVED: import { eq } from 'drizzle-orm'; // Need eq for profile lookup
// REMOVE: import { cookies } from 'next/headers';
import type { NextRequest } from 'next/server'; // Use type import
// Import only getChatsByUserId from queries
import { getChatsByUserId } from '@/lib/db/queries'; // db import removed
// import type { HistoryPage } from '@/components/app-sidebar'; // Import response type if needed
// Use an inline type or define locally if HistoryPage is simple
interface HistoryPage {
  items: any[]; // Replace 'any' with the actual chat type from schema if possible
  hasMore: boolean;
}

// --- Add Type Declaration for Custom Clerk Metadata ---
// This informs TypeScript about the custom fields we expect.
// Based on Clerk docs, sessionClaims has publicMetadata and privateMetadata.
// We are using publicMetadata.
interface CustomPublicMetadata {
  internal_db_id?: string; // Optional because it might not be set yet
  onboarding_webhook_sent?: boolean;
}

// Assuming sessionClaims exists and has a publicMetadata property matching our interface
declare module '@clerk/nextjs/server' {
  interface ClerkJWTClaims extends Record<string, unknown> {
    publicMetadata?: CustomPublicMetadata;
  }
}
// --- End Type Declaration ---

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

  // --- REFACTORED: Use clerkClient to get metadata ---
  const { userId: clerkUserId } = await auth(); // Get clerkId first

  if (!clerkUserId) {
    console.error('[API /api/history] Unauthorized - No Clerk User ID found');
    return new Response('Unauthorized', { status: 401 });
  }

  let userId: string | undefined;
  try {
    const client = await clerkClient(); // Initialize client
    const user = await client.users.getUser(clerkUserId); // Fetch full user object
    // Safely access nested property
    userId = user?.publicMetadata?.internal_db_id as string | undefined;
  } catch (error) {
    console.error(
      `[API /api/history] Error fetching user data from Clerk for Clerk ID: ${clerkUserId}:`,
      error,
    );
    return Response.json(
      { items: [], hasMore: false, error: 'Failed to retrieve user data' },
      { status: 500 },
    );
  }

  if (!userId) {
    console.error(
      `[API /api/history] Internal DB user ID not found in Clerk public metadata for Clerk ID: ${clerkUserId}. User may need to be re-processed by webhook or metadata is missing.`,
    );
    return Response.json(
      { items: [], hasMore: false, error: 'User identifier missing' },
      { status: 404 },
    );
  }
  // --- End Refactored Auth ---

  try {
    console.log(
      `[API /api/history] Calling getChatsByUserId for user ${userId} (from clerkClient) with limit: ${limit}, startingAfter: ${startingAfter}, endingBefore: ${endingBefore}`,
    );
    const result = await getChatsByUserId({
      id: userId,
      limit,
      startingAfter: startingAfter,
      endingBefore: endingBefore,
    });

    // --- ADD LOGGING HERE ---
    console.log(
      '[API /api/history] getChatsByUserId returned:',
      JSON.stringify(result, null, 2),
    );
    // --- END LOGGING ---

    // Ensure the response matches the expected { chats, hasMore } structure
    // The result from getChatsByUserId should already be in this shape.
    const responseData: HistoryPage = {
      items: result.chats,
      hasMore: result.hasMore,
    };

    // Return the result from getChatsByUserId
    return Response.json(responseData);
  } catch (err: any) {
    console.error(`Error fetching chat history:`, err);
    return Response.json(
      { error: 'Error fetching history', details: err.message },
      { status: 500 },
    );
  }
}
