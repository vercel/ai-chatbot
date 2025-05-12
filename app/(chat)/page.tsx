import { cookies } from 'next/headers';
import type { Metadata } from 'next';

import { Chat } from '@/components/chat';
import { models } from '@/lib/ai/models';
import { generateUUID } from '@/lib/utils';
import { DataStreamHandler } from '@/components/data-stream-handler';
import { auth } from '../(auth)/auth';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Chat | LostMind AI',
  description: 'Connect with 5 advanced AI models through LostMind\'s neural interface. Choose from GPT-4, Gemini 2.5 Pro, and more.',
  openGraph: {
    title: 'LostMind AI - Chat',
    description: 'Experience neural-powered AI conversation',
    images: ['/og-chat.png'],
  },
};

export const viewport = {
  themeColor: '#4F46E5',
};

export default async function Page() {
  const session = await auth();

  if (!session) {
    redirect('/api/auth/guest');
  }

  const id = generateUUID();

  const cookieStore = await cookies();
  const modelIdFromCookie = cookieStore.get('chat-model');

  if (!modelIdFromCookie) {
    const defaultModelId = models.find(m => m.isDefault)?.id || models[0]?.id;
    // Basic check if a default model ID was found
    if (!defaultModelId) {
      console.error("Error: Could not determine a default chat model.");
      // Consider redirecting or showing an error message to the user
      // For now, we'll pass an empty string, but this needs robust handling.
    }
    return (
      <>
        <Chat
          key={id}
          id={id}
          initialMessages={[]}
          initialChatModel={defaultModelId || ''} // Use the determined default model ID or fallback
          initialVisibilityType="private"
          isReadonly={false}
          session={session}
          autoResume={false}
        />
        <DataStreamHandler id={id} />
      </>
    );
  }

  return (
    <>
      <Chat
        key={id}
        id={id}
        initialMessages={[]}
        initialChatModel={modelIdFromCookie.value}
        initialVisibilityType="private"
        isReadonly={false}
        session={session}
        autoResume={false}
      />
      <DataStreamHandler id={id} />
    </>
  );
}
