import { auth } from '@/app/(auth)/auth';
import {
  getChatById,
  getMessagesByChatId,
  getStreamIdsByChatId,
} from '@/lib/db/queries';
import type { Chat } from '@/lib/db/schema';
import { ChatSDKError } from '@/lib/errors';
import { createUIMessageStream, JsonToSseTransformStream } from 'ai';
import { differenceInSeconds } from 'date-fns';
import { after } from 'next/server';
import { createResumableStreamContext } from 'resumable-stream';

export const maxDuration = 60;

export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  if (!id) {
    return new ChatSDKError('bad_request:api').toResponse();
  }

  const resumeRequestedAt = new Date();

  const session = await auth();

  if (!session?.user) {
    return new ChatSDKError('unauthorized:chat').toResponse();
  }

  let chat: Chat;

  try {
    chat = await getChatById({ id });
  } catch {
    return new ChatSDKError('not_found:chat').toResponse();
  }

  if (!chat) {
    return new ChatSDKError('not_found:chat').toResponse();
  }

  if (chat.visibility === 'private' && chat.userId !== session.user.id) {
    return new ChatSDKError('forbidden:chat').toResponse();
  }

  const streamIds = await getStreamIdsByChatId({ chatId: id });

  if (!streamIds.length) {
    return new ChatSDKError('not_found:stream').toResponse();
  }

  const recentStreamId = streamIds.at(-1);

  if (!recentStreamId) {
    return new ChatSDKError('not_found:stream').toResponse();
  }

  const emptyDataStream = createUIMessageStream({
    execute: () => {},
  });

  const streamContext = createResumableStreamContext({
    waitUntil: after,
  });

  /*
   * For when the generation is streaming during SSR
   * but the resumable stream has concluded at this point.
   */
  if (!streamContext) {
    const messages = await getMessagesByChatId({ id: id });
    const mostRecentMessage = messages.at(-1);

    if (!mostRecentMessage) {
      return new Response(emptyDataStream, { status: 200 });
    }

    if (mostRecentMessage.role !== 'assistant') {
      return new Response(emptyDataStream, { status: 200 });
    }

    const messageCreatedAt = new Date(mostRecentMessage.createdAt);

    if (differenceInSeconds(resumeRequestedAt, messageCreatedAt) > 15) {
      return new Response(emptyDataStream, { status: 200 });
    }

    const restoredStream = createUIMessageStream({
      execute: ({ writer }) => {
        writer.write({
          type: 'data-append-in-flight-message',
          data: mostRecentMessage,
        });
      },
    });

    return new Response(restoredStream, { status: 200 });
  }

  return new Response(
    await streamContext.resumableStream(recentStreamId, () =>
      emptyDataStream.pipeThrough(new JsonToSseTransformStream()),
    ),
  );
}
