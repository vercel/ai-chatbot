'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Chat } from '@/components/chat';
import { DEFAULT_CHAT_MODEL } from '@/lib/ai/models';
import { generateUUID } from '@/lib/utils';
import { DataStreamHandler } from '@/components/data-stream-handler';
import { apiClient } from '@/lib/api-client';

export default function Page() {
  const router = useRouter();
  const [id, setId] = useState(generateUUID());
  const [selectedModel, setSelectedModel] = useState(DEFAULT_CHAT_MODEL);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeChat = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      try {
        // Create a new chat
        // const chatResponse = await apiClient.createChat({
        //   message: 'New Chat'
        // });
        // setId(chatResponse.id);

        // Get chat model from localStorage
        const chatModel = localStorage.getItem('model') || selectedModel;
        console.log('chatModel', chatModel);
        setSelectedModel(chatModel);
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to initialize chat:', error);
        setIsLoading(false);
      }
    };

    initializeChat();
  }, [router]);
  if (isLoading) {
    return (
      <div className="flex justify-center items-center px-4 pt-40">
        <div className="w-full max-w-2xl mt-16 animate-pulse space-y-10 ">
          {/* Welcome Title Placeholder */}
          <div className="h-8 bg-gray-200  rounded mx-auto w-3/4" />
          <div className="h-8 bg-gray-100 rounded mx-auto w-3/4" />

          {/* Prompt Button Skeletons */}
          <div className="grid grid-cols-2 mt-28 gap-4 justify-center items-center">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 bg-gray-200 rounded w-full" />
            ))}
          </div>

          {/* Chat input skeleton */}
          <div className="h-28 bg-gray-200 rounded-lg w-full mt-8" />
        </div>
      </div>
    );
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
      />
      <DataStreamHandler id={id} />
    </>
  );
}
