'use server';

import { generateText, type UIMessage } from 'ai';
import type { VisibilityType } from '@/components/visibility-selector';
import { myProvider } from '@/lib/ai/providers';
import { apiClient } from '@/lib/api-client';

export async function saveChatModelAsCookie(model: string) {
  // This should be handled by the frontend state management
  return model;
}

export async function generateTitleFromUserMessage({
  message,
}: {
  message: UIMessage;
}) {
  const { text: title } = await generateText({
    model: myProvider.languageModel('title-model'),
    system: `\n
    - you will generate a short title based on the first message a user begins a conversation with
    - ensure it is not more than 80 characters long
    - the title should be a summary of the user's message
    - do not use quotes or colons`,
    prompt: JSON.stringify(message),
  });

  return title;
}

export async function deleteTrailingMessages(chatId: string, messageId: string) {
  try {
    await apiClient.deleteMessage(messageId, chatId);
    return { success: true };
  } catch (error) {
    console.error('Failed to delete messages:', error);
    return { success: false, error };
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
    await apiClient.updateChatVisibility(chatId, {
      // isVisible: visibility === 'public',
      visibility: visibility
    });
    return { success: true };
  } catch (error) {
    console.error('Failed to update chat visibility:', error);
    return { success: false, error };
  }
}
