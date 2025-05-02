'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Chat } from '@/components/chat';
import { DEFAULT_CHAT_MODEL } from '@/lib/ai/models';
import { generateUUID } from '@/lib/utils';
import { DataStreamHandler } from '@/components/data-stream-handler';

export default function Page() {
  const router = useRouter();
  const [id] = useState(generateUUID());
  const [selectedModel, setSelectedModel] = useState(DEFAULT_CHAT_MODEL);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    // Get chat model from localStorage
    const chatModel = localStorage.getItem('chat-model') || DEFAULT_CHAT_MODEL;
    setSelectedModel(chatModel);
    setIsLoading(false);
  }, [router]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <Chat
        key={id}
        id={id}
        initialMessages={[]}
        selectedChatModel={selectedModel}
        selectedVisibilityType="private"
        isReadonly={false}
        session={{ 
          user: { id: '1', email: 'user@example.com', type: 'regular' },
          expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours from now
        }}
      />
      <DataStreamHandler id={id} />
    </>
  );
}
