'use server';

import { type CoreUserMessage, Message } from 'ai';
import { cookies } from 'next/headers';

export async function saveModelId(model: string) {
  const cookieStore = await cookies();
  cookieStore.set('model-id', model);
}

export async function generateTitleFromUserMessage({
  message,
}: {
  message: Message;
}) {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'mixtral-8x7b-32768',  // or your preferred Groq model
      messages: [
        {
          role: 'system',
          content: `
          - you will generate a short title based on the first message a user begins a conversation with
          - ensure it is not more than 80 characters long
          - the title should be a summary of the user's message
          - do not use quotes or colons`
        },
        {
          role: 'user',
          content: message.content
        }
      ],
      temperature: 0.7,
      max_tokens: 100,
    }),
  });

  if (!response.ok) {
    throw new Error(`Groq API error: ${response.statusText}`);
  }

  const result = await response.json();
  return result.choices[0].message.content.trim();
}
