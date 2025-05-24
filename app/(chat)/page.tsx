// import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { auth } from '@clerk/nextjs/server'; // Import Clerk auth helper

import { Chat } from '@/components/chat';
import { DEFAULT_CHAT_MODEL } from '@/lib/ai/models';
import { generateUUID } from '@/lib/utils';
import { DataStreamHandler } from '@/components/data-stream-handler';

export default async function Page() {
  const id = generateUUID();
  const cookieStore = await cookies();
  const modelIdFromCookie = cookieStore.get('chat-model');

  // Remove Supabase client creation and auth call
  // const supabase = await createClient();
  // const {
  //   data: { user },
  //   error,
  // } = await supabase.auth.getUser();

  // Get Clerk user ID
  const { userId } = await auth();

  // Middleware should handle redirect, but check userId as safeguard
  if (!userId) {
    console.error(
      '(chat)/page.tsx: No Clerk userId found despite middleware. Redirecting.',
    );
    // Optionally redirect, or rely on middleware (safer if middleware is robust)
    // redirect('/sign-in'); // Redirect to Clerk sign-in
    return null; // Or render an unauthorized state
  }

  if (!modelIdFromCookie) {
    return (
      <>
        <Chat
          key={id}
          id={id}
          initialMessages={[]}
          initialAssociatedDocument={null}
          selectedChatModel={DEFAULT_CHAT_MODEL}
          selectedVisibilityType="private"
          isReadonly={false}
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
        initialAssociatedDocument={null}
        selectedChatModel={modelIdFromCookie.value}
        selectedVisibilityType="private"
        isReadonly={false}
      />
      <DataStreamHandler id={id} />
    </>
  );
}
