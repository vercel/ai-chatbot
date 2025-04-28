// import { createClient } from '../../../../lib/supabase/server'; // REMOVE SUPABASE
import { auth } from '@clerk/nextjs/server'; // ADD CLERK
// REMOVED: import { db } from '@/lib/db/queries'; // Need DB for profile lookup
import * as schema from '@/lib/db/schema'; // Need schema for profile lookup
import { eq } from 'drizzle-orm'; // Need eq for profile lookup
import {
  db, // Already consolidated here
  getSuggestionsByDocumentId,
} from '@/lib/db/queries';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const documentId = searchParams.get('documentId');

  if (!documentId) {
    return new Response('Not Found', { status: 404 });
  }

  // --- CLERK AUTH & PROFILE LOOKUP ---
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) {
    return new Response('Unauthorized', { status: 401 });
  }
  const profile = await db.query.userProfiles.findFirst({
    columns: { id: true },
    where: eq(schema.userProfiles.clerkId, clerkUserId),
  });
  if (!profile) {
    return new Response('User profile not found', { status: 404 });
  }
  const userId = profile.id; // Use the internal profile UUID
  // --- END AUTH ---

  const suggestions = await getSuggestionsByDocumentId({
    documentId,
  });

  const [suggestion] = suggestions;

  if (!suggestion) {
    return Response.json([], { status: 200 });
  }

  // Check ownership using the internal profile UUID
  if (suggestion.userId !== userId) {
    return new Response('Unauthorized', { status: 401 });
  }

  return Response.json(suggestions, { status: 200 });
}
