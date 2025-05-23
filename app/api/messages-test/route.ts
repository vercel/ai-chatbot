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

  console.log(`[API /api/messages-test] Chat ID for getChatById: ${chatId}`);
  const chat = await getChatById({ id: chatId });
  console.log(
    `[API /api/messages-test] Result from getChatById for ${chatId}:`,
    chat ? `Found chat with userId ${chat.userId}` : 'NOT FOUND',
  );

  if (!chat) {
    console.error(
      `[API /api/messages-test] CRITICAL: Chat not found for ID ${chatId}. Returning 404.`,
    );
    return new Response('Chat not found', { status: 404 });
  }

  // Check ownership using the internal profile UUID
  if (chat.userId !== userId) {
    return new Response('Unauthorized', { status: 401 });
  }

  const messages = await getMessagesByChatId({ id: chatId });

  return Response.json(messages, { status: 200 });
}
