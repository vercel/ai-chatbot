'use client';

import React, { createContext, type ReactNode, useContext } from 'react';
import { defaultChatStore, type InferUIDataTypes, type UIMessage } from 'ai';
import { fetchWithErrorHandlers, generateUUID } from '@/lib/utils';
import type { dataPartSchemas, MessageMetadata } from '@/lib/types';

const chatStore = defaultChatStore<MessageMetadata, typeof dataPartSchemas>({
  api: '/api/chat',
  fetch: fetchWithErrorHandlers,
  generateId: generateUUID,
  prepareRequestBody: (body) => ({
    id: body.chatId,
    message: body.messages.at(-1),
    selectedChatModel: 'chat-model',
    selectedVisibilityType: 'private',
  }),

  chats: {},
});

export type ChatStore = typeof chatStore;

const ChatStoreContext = createContext(chatStore);

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
  initialMessages: UIMessage<
    MessageMetadata,
    InferUIDataTypes<typeof dataPartSchemas>
  >[];
};

export function ChatStoreProvider({
  children,
  id,
  initialChatModel,
  visibilityType,
  initialMessages,
}: Props) {
  chatStore.addChat(id, initialMessages);

  return (
    <ChatStoreContext.Provider value={chatStore}>
      {children}
    </ChatStoreContext.Provider>
  );
}
