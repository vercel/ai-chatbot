'use server';

import { generateText, type UIMessage } from 'ai';
import { cookies } from 'next/headers';
import {
  deleteMessagesByChatIdAfterTimestamp,
  getMessageById,
  updateChatVisiblityById,
} from '@/lib/db/queries';
import type { VisibilityType } from '@/components/visibility-selector';
import { configuredProviders } from '@/lib/ai/providers';
import { getModelConfigById } from '@/lib/ai/models';
import { isTestEnvironment } from '@/lib/constants'; // Assuming constants holds this

export async function saveChatModelAsCookie(model: string) {
  const cookieStore = await cookies();
  cookieStore.set('chat-model', model);
}

export async function generateTitleFromUserMessage({
  message,
}: {
  message: UIMessage;
}) {
  // --- Dynamic Model Selection for Title Generation ---
  const internalModelId = 'title-model'; // Or fetch from config/env if needed
  const modelConfig = getModelConfigById(internalModelId);

  if (!modelConfig) {
    console.error(`Model config not found for ID: ${internalModelId}`);
    // Handle error appropriately - maybe return a default title or throw
    return 'Chat Title Error';
  }

  // Use provider name from config, default to 'test' in test env
  const providerName = isTestEnvironment ? 'test' : modelConfig.provider;
  const provider = configuredProviders[providerName as keyof typeof configuredProviders];

  if (!provider) {
    console.error(`Provider not found for name: ${providerName}`);
    return 'Chat Title Error';
  }

  // Use providerModelId from config, but in test env, use the internal ID
  // because the test provider maps internal IDs to test models
  const providerModelId = isTestEnvironment ? internalModelId : modelConfig.providerModelId;
  const targetModel = provider.languageModel(providerModelId);

  if (!targetModel) {
    console.error(`Language model '${providerModelId}' not found in provider '${providerName}'`);
    return 'Chat Title Error';
  }
  // --- End Dynamic Model Selection ---

  const { text: title } = await generateText({
    model: targetModel, // Use the dynamically selected model
    system: `\n
    - you will generate a short title based on the first message a user begins a conversation with
    - ensure it is not more than 80 characters long
    - the title should be a summary of the user's message
    - do not use quotes or colons`,
    prompt: JSON.stringify(message),
  });

  return title;
}

export async function deleteTrailingMessages({ id }: { id: string }) {
  const [message] = await getMessageById({ id });

  await deleteMessagesByChatIdAfterTimestamp({
    chatId: message.chatId,
    timestamp: message.createdAt,
  });
}

export async function updateChatVisibility({
  chatId,
  visibility,
}: {
  chatId: string;
  visibility: VisibilityType;
}) {
  await updateChatVisiblityById({ chatId, visibility });
}
