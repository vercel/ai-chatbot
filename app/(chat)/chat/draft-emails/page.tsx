import { cookies } from 'next/headers';

import { PrivateCodeChat } from '@/components/chat';
import type { Metadata } from 'next';
import { DEFAULT_CHAT_MODEL } from '@/lib/ai/models';

export const metadata: Metadata = {
  metadataBase: new URL('https://chatbot-in.vercel.app/draft-emails'),
  title: 'Draft Professional Emails',
};
const chatId = 'draft-emails';
const title = 'Draft Professional Emails';
const SYSTEM_PROMPT = `
You are an expert email writing assistant, focused on crafting professional and empathetic messages. Follow these guidelines when composing emails:

TONE:
- Be warm yet professional
- Sound confident and authentic
- Show appreciation and respect

STRUCTURE:
- Opening: Hi [Name], I hope you're having a wonderful day!
- Body: Present your key message with enthusiasm
- Closing: End with next steps + warm wishes

TRANSFORMATIONS:
- "Deadline missed" → "Let's set a fresh timeline"
- "Problem with" → "Opportunity to enhance"
- "You must" → "I recommend"
- "I need" → "I would appreciate"

KEY RULE:
Always ask yourself: "Will this message make the reader feel valued and motivated?"
`;

export default async function PrivateCodeChatPage() {
  const cookieStore = await cookies();
  const chatModelFromCookie = cookieStore.get('chat-model');
  if (!chatModelFromCookie) {
    return (
      <PrivateCodeChat
        id={chatId}
        selectedChatModel={DEFAULT_CHAT_MODEL}
        systemPrompt={SYSTEM_PROMPT}
      />
    );
  } else {
    return (
      <PrivateCodeChat
        id={chatId}
        selectedChatModel={chatModelFromCookie?.value}
        systemPrompt={SYSTEM_PROMPT}
      />
    );
  }
}
