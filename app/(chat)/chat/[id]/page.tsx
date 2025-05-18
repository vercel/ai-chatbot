'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Chat } from '@/components/chat';
import { DataStreamHandler } from '@/components/data-stream-handler';
import { DEFAULT_CHAT_MODEL } from '@/lib/ai/models';
import type { Attachment, UIMessage } from 'ai';
import { apiClient } from '@/lib/api-client';
import {use} from 'react';
import { promises } from 'dns';

type DBMessage = {
  id: string;
  role: string;
  parts: any[];
  attachments: Attachment[];
  createdAt: Date;
};

export default function Page({ params }: { params:Promise<{ id: string }>  }) {
  const router = useRouter();
  const [chat, setChat] = useState<any>(null);
  const [messages, setMessages] = useState<Array<UIMessage>>([]);
  const [selectedModel, setSelectedModel] = useState(DEFAULT_CHAT_MODEL);
  const [isLoading, setIsLoading] = useState(true);

  const { id } = use(params);

  useEffect(() => {
    
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          router.push('/login');
          return;
        }

        const chatData = await apiClient.getChat(id);
        if (!chatData) {
          router.push('/404');
          return;
        }

        // Check if chat is private and user is authorized
        if (chatData.visibility === 'private') {
          // You might want to decode the JWT token to get user ID
          // For now, we'll just check if token exists
          if (!token) {
            router.push('/404');
            return;
          }
        }

        const messagesFromDb = await apiClient.getMessagesInChat(id);
        const convertedMessages = convertToUIMessages(messagesFromDb);

        // Get chat model from localStorage
        const chatModel = localStorage.getItem('chat-model') || DEFAULT_CHAT_MODEL;

        setChat(chatData);
        setMessages(convertedMessages);
        setSelectedModel(chatModel);
      } catch (error) {
        console.error('Error fetching chat data:', error);
        router.push('/404');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id, router]);

  function convertToUIMessages(messages: Array<DBMessage>): Array<UIMessage> {
    return messages.map((message) => ({
      id: message.id,
      parts: message.parts as UIMessage['parts'],
      role: message.role as UIMessage['role'],
      content: '',
      createdAt: message.createdAt,
      experimental_attachments:
        (message.attachments as Array<Attachment>) ?? [],
    }));
  }

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!chat) {
    return null;
  }

  return (
    <>
      <Chat
        id={chat.id}
        initialMessages={messages}
        selectedChatModel={selectedModel}
        selectedVisibilityType={chat.visibility}
        isReadonly={false} // You might want to implement proper readonly logic based on user permissions
        // session={{ 
        //   user: { id: '1', email: 'user@example.com', type: 'regular' },
        //   expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours from now
        // }}
      />
      <DataStreamHandler id={id} />
    </>
  );
}
