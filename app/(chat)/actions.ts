'use server';

import { type CoreUserMessage, generateText } from 'ai';
import { cookies } from 'next/headers';

import { customModel } from '@/lib/ai';
import { getModelById } from '@/lib/ai/models';

export async function saveModelId(model: string) {
  console.log('🔄 Saving model ID:', model);
  const cookieStore = await cookies();
  cookieStore.set('model-id', model);
  console.log('✅ Model ID saved to cookies');
}

export async function generateTitleFromUserMessage({
  message,
}: {
  message: CoreUserMessage;
}) {
  console.log('🚀 Generating title for message:', message);

  try {
    const model = getModelById('gemini-flash');
    if (!model) throw new Error('Model not found');

    const { text: title } = await generateText({
      model: customModel(model.apiIdentifier),
      system: `\n
      - you will generate a short title based on the first message a user begins a conversation with
      - ensure it is not more than 80 characters long
      - the title should be a summary of the user's message
      - do not use quotes or colons`,
      prompt: JSON.stringify(message),
    });

    if (!title?.trim()) {
      throw new Error('Empty response received');
    }

    console.log('✅ Generated title:', title);
    return title;
  } catch (error) {
    console.error('❌ Error generating title:', error);
    return 'New Conversation';
  }
}
