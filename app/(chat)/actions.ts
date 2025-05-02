'use server';

import { generateText, type UIMessage } from 'ai';
import { cookies } from 'next/headers';
import {
  getChatById,
  getMessagesByChatId,
  updateChatVisiblityById,
  deleteMessagesByChatIdAfterTimestamp,
} from '@/lib/db/queries';
import type { VisibilityType } from '@/components/visibility-selector';
import { myProvider } from '@/lib/ai/providers';

export async function saveChatModelAsCookie(model: string) {
  cookies().set('chatModel', model);
}

export async function generateTitleFromUserMessage({
  message,
}: {
  message: UIMessage;
}) {
  try {
    // Generate a title based on the first user message
    const response = await generateText({
      prompt: `Generate a very short title (3-5 words) for a conversation starting with this message: "${message.content}"`,
      provider: myProvider,
      maxTokens: 20,
    });

    return response;
  } catch (error) {
    console.error('Failed to generate title:', error);
    return 'New chat';
  }
}

export async function deleteTrailingMessages({ id }: { id: string }) {
  try {
    // Find the most recent user message timestamp
    const chat = await getChatById({ id });
    if (!chat) {
      throw new Error(`Chat with id ${id} not found`);
    }

    const messages = await getMessagesByChatId({ id });

    // Find the timestamp of the most recent user message
    let latestUserMessageIndex = -1;
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'user') {
        latestUserMessageIndex = i;
        break;
      }
    }

    if (latestUserMessageIndex !== -1) {
      const timestamp = messages[latestUserMessageIndex].createdAt;
      // Delete all messages after this timestamp
      await deleteMessagesByChatIdAfterTimestamp({
        chatId: id,
        timestamp,
      });
    }
  } catch (error) {
    console.error('Error deleting trailing messages:', error);
    throw error;
  }
}

export async function updateChatVisibility({
  chatId,
  visibility,
}: {
  chatId: string;
  visibility: VisibilityType;
}) {
  try {
    return await updateChatVisiblityById({
      chatId,
      visibility,
    });
  } catch (error) {
    console.error('Error updating chat visibility:', error);
    throw error;
  }
}
