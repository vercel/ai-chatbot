'use client';

import React, {
  createContext,
  type ReactNode,
  useContext,
  useMemo,
} from 'react';
import { defaultChatStore, type UIMessage } from 'ai';
import { fetchWithErrorHandlers, generateUUID } from '@/lib/utils';
import { zodSchema } from '@ai-sdk/provider-utils';
import { messageMetadataSchema } from '@/lib/types';

type ChatStoreType = ReturnType<typeof defaultChatStore>;

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
      defaultChatStore({
        api: '/api/chat',
        fetch: fetchWithErrorHandlers,
        messageMetadataSchema: zodSchema(messageMetadataSchema),
        generateId: generateUUID,
        prepareRequestBody: (body) => ({
          id,
          message: body.messages.at(-1),
          selectedChatModel: initialChatModel,
          selectedVisibilityType: visibilityType,
        }),
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
