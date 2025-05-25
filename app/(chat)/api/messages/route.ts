import { auth } from '@clerk/nextjs/server';
import * as schema from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { db, getChatById, getMessagesByChatId } from '@/lib/db/queries';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const chatId = searchParams.get('chatId');

  if (!chatId) {
    return new Response('chatId is required', { status: 400 });
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

  console.log(`[API /api/messages] Chat ID for getChatById: ${chatId}`);
  let chat = await getChatById({ id: chatId });
  let attempts = 0;
  const maxAttempts = 3; // Number of retries, so 4 total attempts
  const retryDelayMs = 300;

  while (!chat && attempts < maxAttempts) {
    attempts++;
    console.log(
      `[API /api/messages] Chat not found on attempt ${attempts} of ${maxAttempts}. Retrying in ${retryDelayMs}ms...`,
    );
    await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
    chat = await getChatById({ id: chatId });
  }

  console.log(
    `[API /api/messages] Result from getChatById for ${chatId} after initial + ${attempts} attempt(s):`,
    chat ? `Found chat with userId ${chat.userId}` : 'NOT FOUND',
  );

  if (!chat) {
    console.error(
      `[API /api/messages] CRITICAL: Chat not found for ID ${chatId} after ${attempts + 1} total attempts. Returning 404.`,
    );
    // Return a JSON response for 404
    return new Response(
      JSON.stringify({ error: 'Chat not found', messages: [] }),
      {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }

  // Check ownership using the internal profile UUID
  if (chat.userId !== userId) {
    return new Response('Unauthorized', { status: 401 });
  }

  const messages = await getMessagesByChatId({ id: chatId });

  return Response.json(messages, { status: 200 });
}
