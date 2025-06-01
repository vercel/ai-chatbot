import { auth } from '@/app/(auth)/auth';
import { getChatIdFromMemoryMessage } from '@/lib/db/queries';
import type { NextRequest } from 'next/server';
import { ChatSDKError } from '@/lib/errors';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ messageId: string }> },
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return new ChatSDKError('unauthorized:memory').toResponse();
    }

    const { messageId } = await params;
    const chatId = await getChatIdFromMemoryMessage({
      originalMessageId: messageId,
    });

    if (!chatId) {
      return new ChatSDKError('not_found:chat').toResponse();
    }

    return Response.json({ chatId });
  } catch (error) {
    if (error instanceof ChatSDKError) {
      return error.toResponse();
    }
    return new ChatSDKError('bad_request:api').toResponse();
  }
}
