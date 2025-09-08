'use client';
import { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { useChat, type UseChatHelpers } from '@ai-sdk/react';
import type { ErrorState, ToolStep } from './types';
import type { UIMessage } from 'ai';

interface ChatContextValue extends UseChatHelpers<UIMessage> {
  errorState?: ErrorState;
  steps: ToolStep[];
  setSteps: (s: ToolStep[]) => void;
}

const ChatContext = createContext<ChatContextValue | undefined>(undefined);

export function ChatProvider({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  const chat = useChat();
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

  const value = useMemo(
    () => ({ ...chat, errorState, steps, setSteps }),
    [chat, errorState, steps],
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChatContext() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChatContext must be used within ChatProvider');
  return ctx;
}
