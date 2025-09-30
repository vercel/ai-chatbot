import { auth } from '@/app/(auth)/auth';
import type { NextRequest } from 'next/server';
import { getChatsByUserId, getMastraThreadsByUserId } from '@/lib/db/queries';
import { ChatSDKError } from '@/lib/errors';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const limit = Number.parseInt(searchParams.get('limit') || '10');
  const startingAfter = searchParams.get('starting_after');
  const endingBefore = searchParams.get('ending_before');

  if (startingAfter && endingBefore) {
    return new ChatSDKError(
      'bad_request:api',
      'Only one of starting_after or ending_before can be provided.',
    ).toResponse();
  }

  const session = await auth();

  if (!session?.user) {
    return new ChatSDKError('unauthorized:chat').toResponse();
  }

  // Get chats from both the client's Chat table and Mastra's threads
  const { chats: clientChats } = await getChatsByUserId({
    id: session.user.id,
    limit,
    startingAfter,
    endingBefore,
  });

  const mastraThreads = await getMastraThreadsByUserId({
    id: session.user.id,
    limit,
  });

  // Merge and sort by most recent (updatedAt for Mastra threads, createdAt for client chats)
  const allChats = [...clientChats, ...mastraThreads]
    .sort((a, b) => {
      const dateA = 'updatedAt' in a ? a.updatedAt : a.createdAt;
      const dateB = 'updatedAt' in b ? b.updatedAt : b.createdAt;
      return new Date(dateB).getTime() - new Date(dateA).getTime();
    })
    .slice(0, limit);

  return Response.json({
    chats: allChats,
    hasMore: false, // Simplified for now
  });
}
