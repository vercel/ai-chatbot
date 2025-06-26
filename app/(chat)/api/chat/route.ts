import { ChatSDKError } from '@/lib/errors';
import {
  validatePostRequest,
  validateChatId,
  validateDeleteId,
} from '@/lib/services/validation.service';
import {
  authenticateUser,
  validateRateLimit,
  validateChatAccess,
  validateChatOwnership,
  validateChatVisibility,
} from '@/lib/services/auth.service';
import {
  ensureChatExists,
  prepareChatContext,
  saveUserMessage,
  getRecentStreamId,
  deleteChat,
  getRecentMessage,
} from '@/lib/services/chat.service';
import {
  createAIStream,
  createResumableResponse,
  resumeStream,
  createEmptyStream,
  createRestoredStream,
  shouldRestoreMessage,
} from '@/lib/services/streaming.service';

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const requestBody = await validatePostRequest(request);
    const user = await authenticateUser();

    await validateRateLimit(user);
    await validateChatAccess(requestBody.id, user.id);

    await ensureChatExists(requestBody, user);

    const context = await prepareChatContext(requestBody, user, request);

    await saveUserMessage(requestBody, context.chatId);

    const stream = createAIStream(requestBody, context);

    return await createResumableResponse(context.streamId, stream);
  } catch (error) {
    if (error instanceof ChatSDKError) {
      return error.toResponse();
    }

    console.error('Unexpected error in chat route:', error);
    return new ChatSDKError('internal_server_error:chat').toResponse();
  }
}

export async function GET(request: Request) {
  try {
    const resumeRequestedAt = new Date();
    const { searchParams } = new URL(request.url);
    const chatId = validateChatId(searchParams.get('chatId'));

    const user = await authenticateUser();
    await validateChatVisibility(chatId, user.id);

    const recentStreamId = await getRecentStreamId(chatId);
    const stream = await resumeStream(recentStreamId);

    if (!stream) {
      const mostRecentMessage = await getRecentMessage(chatId);

      if (!mostRecentMessage) {
        const emptyStream = createEmptyStream();
        return new Response(emptyStream, { status: 200 });
      }

      if (shouldRestoreMessage(mostRecentMessage, resumeRequestedAt)) {
        const restoredStream = createRestoredStream(mostRecentMessage);
        return new Response(restoredStream, { status: 200 });
      }

      const emptyStream = createEmptyStream();
      return new Response(emptyStream, { status: 200 });
    }

    return new Response(stream, { status: 200 });
  } catch (error) {
    if (error instanceof ChatSDKError) {
      return error.toResponse();
    }

    console.error('Unexpected error in GET chat route:', error);
    return new ChatSDKError('internal_server_error:chat').toResponse();
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = validateDeleteId(searchParams.get('id'));

    const user = await authenticateUser();
    await validateChatOwnership(id, user.id);

    const deletedChat = await deleteChat(id);

    return Response.json(deletedChat, { status: 200 });
  } catch (error) {
    if (error instanceof ChatSDKError) {
      return error.toResponse();
    }

    console.error('Unexpected error in DELETE chat route:', error);
    return new ChatSDKError('internal_server_error:chat').toResponse();
  }
}
