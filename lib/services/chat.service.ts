import { appendClientMessage, appendResponseMessages } from 'ai';
import { geolocation } from '@vercel/functions';
import {
  getChatById,
  getMessagesByChatId,
  getStreamIdsByChatId,
  saveChat,
  saveMessages,
  createStreamId,
  deleteChatById,
} from '@/lib/db/queries';
import { generateTitleFromUserMessage } from '@/app/(chat)/actions';
import { generateUUID, getTrailingMessageId } from '@/lib/utils';
import { ChatSDKError } from '@/lib/errors';
import type { RequestHints } from '@/lib/ai/prompts';
import type { PostRequestBody } from '@/app/(chat)/api/chat/schema';
import type { AuthenticatedUser } from './auth.service';
import type { Chat } from '@/lib/db/schema';

export interface ChatContext {
  chatId: string;
  user: AuthenticatedUser;
  messages: any[];
  requestHints: RequestHints;
  streamId: string;
}

export async function ensureChatExists(
  requestBody: PostRequestBody,
  user: AuthenticatedUser,
): Promise<void> {
  const { id, message, selectedVisibilityType } = requestBody;
  const chat = await getChatById({ id });

  if (!chat) {
    const title = await generateTitleFromUserMessage({ message });

    await saveChat({
      id,
      userId: user.id,
      title,
      visibility: selectedVisibilityType,
    });
  }
}

export async function prepareChatContext(
  requestBody: PostRequestBody,
  user: AuthenticatedUser,
  request: Request,
): Promise<ChatContext> {
  const { id, message } = requestBody;

  const previousMessages = await getMessagesByChatId({ id });
  const messages = appendClientMessage({
    messages: previousMessages,
    message,
  });

  const { longitude, latitude, city, country } = geolocation(request);
  const requestHints: RequestHints = {
    longitude,
    latitude,
    city,
    country,
  };

  const streamId = generateUUID();
  await createStreamId({ streamId, chatId: id });

  return {
    chatId: id,
    user,
    messages,
    requestHints,
    streamId,
  };
}

export async function saveUserMessage(
  requestBody: PostRequestBody,
  chatId: string,
): Promise<void> {
  const { message } = requestBody;

  await saveMessages({
    messages: [
      {
        chatId,
        id: message.id,
        role: 'user',
        parts: message.parts,
        attachments: message.experimental_attachments ?? [],
        createdAt: new Date(),
      },
    ],
  });
}

export async function saveAssistantMessage(
  chatId: string,
  userMessage: any,
  responseMessages: any[],
): Promise<void> {
  const assistantId = getTrailingMessageId({
    messages: responseMessages.filter(
      (message) => message.role === 'assistant',
    ),
  });

  if (!assistantId) {
    throw new Error('No assistant message found!');
  }

  const [, assistantMessage] = appendResponseMessages({
    messages: [userMessage],
    responseMessages: responseMessages,
  });

  await saveMessages({
    messages: [
      {
        id: assistantId,
        chatId,
        role: assistantMessage.role,
        parts: assistantMessage.parts,
        attachments: assistantMessage.experimental_attachments ?? [],
        createdAt: new Date(),
      },
    ],
  });
}

export async function getRecentStreamId(chatId: string): Promise<string> {
  const streamIds = await getStreamIdsByChatId({ chatId });

  if (!streamIds.length) {
    throw new ChatSDKError('not_found:stream');
  }

  const recentStreamId = streamIds.at(-1);

  if (!recentStreamId) {
    throw new ChatSDKError('not_found:stream');
  }

  return recentStreamId;
}

export async function deleteChat(chatId: string): Promise<Chat> {
  return await deleteChatById({ id: chatId });
}

export async function getRecentMessage(chatId: string) {
  const messages = await getMessagesByChatId({ id: chatId });
  return messages.at(-1);
}
