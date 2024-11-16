'use server';

import { type CoreUserMessage, generateText } from 'ai';
import { cookies } from 'next/headers';

import { customModel } from '@/lib/ai';

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
    const { text: title } = await generateText({
      model: customModel('gemini-1.5-pro-latest'),
      system: `\n
      - you will generate a short title based on the first message a user begins a conversation with
      - ensure it is not more than 80 characters long
      - the title should be a summary of the user's message
      - do not use quotes or colons`,
      prompt: JSON.stringify(message),
    });

    console.log('✅ Generated title:', title);
    return title;
  } catch (error) {
    console.error('❌ Error generating title:', error);
    // Return a fallback title in case of error
    return 'New Conversation';
  }
}
