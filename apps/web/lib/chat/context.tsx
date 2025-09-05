'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { useChat, type UseChatHelpers } from 'ai/react';
import type { ErrorState, ToolStep } from './types';

interface ChatContextValue extends UseChatHelpers {
  errorState?: ErrorState;
  steps: ToolStep[];
  setSteps: (s: ToolStep[]) => void;
}

const ChatContext = createContext<ChatContextValue | undefined>(undefined);

export function ChatProvider({
  children,
  api = '/api/chat',
}: {
  children: React.ReactNode;
  api?: string;
}) {
  const chat = useChat({ api });
  const [errorState, setErrorState] = useState<ErrorState>();
  const [steps, setSteps] = useState<ToolStep[]>([]);

  useEffect(() => {
    if (!chat.error) return;
    const message = chat.error.message;
    let type: ErrorState['type'] = 'server';
    if (message.includes('timeout')) type = 'timeout';
    if (!navigator.onLine) type = 'offline';
    setErrorState({ type, message });
  }, [chat.error]);

  return (
    <ChatContext.Provider value={{ ...chat, errorState, steps, setSteps }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChatContext() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChatContext must be used within ChatProvider');
  return ctx;
}
