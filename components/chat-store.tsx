'use client';

import React, {
  createContext,
  type ReactNode,
  useContext,
  useMemo,
} from 'react';
import { DefaultChatTransport, type UIMessage } from 'ai';
import { generateUUID } from '@/lib/utils';
import { messageMetadataSchema } from '@/lib/types';
import { createChatStore } from '@ai-sdk/react';

type ChatStoreType = ReturnType<typeof createChatStore>;

const ChatStoreContext = createContext<ChatStoreType | null>(null);

export function useChatStore() {
  const context = useContext(ChatStoreContext);

  if (!context) {
    throw new Error('useChatStore must be used within a ChatStoreProvider');
  }

  return context;
}

type Props = {
  children: ReactNode;
  id: string;
  initialChatModel: string;
  visibilityType: string;
  initialMessages: UIMessage[];
};

export function ChatStoreProvider({
  children,
  id,
  initialChatModel,
  visibilityType,
  initialMessages,
}: Props) {
  const store = useMemo(
    () =>
      createChatStore({
        transport: new DefaultChatTransport({
          api: '/api/chat',
          prepareRequestBody: (body) => ({
            id,
            message: body.messages.at(-1),
            selectedChatModel: initialChatModel,
            selectedVisibilityType: visibilityType,
          }),
        }),
        messageMetadataSchema: messageMetadataSchema,
        generateId: generateUUID,
        chats: {
          [id]: {
            messages: initialMessages,
          },
        },
      }),
    [id, initialChatModel, visibilityType, initialMessages],
  );
  return (
    <ChatStoreContext.Provider value={store}>
      {children}
    </ChatStoreContext.Provider>
  );
}
