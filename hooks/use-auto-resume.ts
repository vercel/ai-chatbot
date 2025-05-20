'use client';

import type { DataUIPart } from 'ai';
import type { UseChatHelpers } from '@ai-sdk/react';
import { useChatStore } from '@/components/chat-store';
import { useEffect, useMemo } from 'react';

export interface UseAutoResumeParams {
  chatId: string;
  autoResume: boolean;
  experimental_resume: UseChatHelpers['experimental_resume'];
}

export function useAutoResume({
  chatId,
  autoResume,
  experimental_resume,
}: UseAutoResumeParams) {
  const chatStore = useChatStore();

  const messages = useMemo(() => {
    return chatStore.getMessages(chatId);
  }, [chatId, chatStore]);

  useEffect(() => {
    if (!autoResume) return;

    const mostRecentMessage = messages.at(-1);

    if (mostRecentMessage?.role === 'user') {
      experimental_resume();
    }

    // we intentionally run this once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dataStream = useMemo(() => {
    const mostRecentMessage = messages.at(-1);

    const dataParts = mostRecentMessage
      ? mostRecentMessage.parts.filter((part) => part.type.startsWith('data-'))
      : [];

    return dataParts;
  }, [messages]);

  useEffect(() => {
    if (dataStream.length === 0) return;

    const dataPart = dataStream.at(-1) as DataUIPart<any>;

    if (dataPart.type === 'data-append-in-flight-message') {
      const message = dataPart.data;

      chatStore.setMessages({
        id: chatId,
        messages: [...messages, message],
      });
    }
  }, [messages, dataStream, chatId, chatStore]);
}
