'use client';

import { useEffect, useMemo } from 'react';
import type { DataUIPart, UIMessage } from 'ai';
import type { UseChatHelpers } from '@ai-sdk/react';

export interface UseAutoResumeParams {
  autoResume: boolean;
  experimental_resume: UseChatHelpers['experimental_resume'];
  messages: UseChatHelpers['messages'];
  setMessages: UseChatHelpers['setMessages'];
}

export function useAutoResume({
  autoResume,
  experimental_resume,
  messages,
  setMessages,
}: UseAutoResumeParams) {
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

    // @ts-expect-error fix type error
    const dataParts: DataUIPart<any>[] = mostRecentMessage
      ? mostRecentMessage.parts.filter((part) => part.type.startsWith('data-'))
      : [];

    return dataParts;
  }, [messages]);

  useEffect(() => {
    if (dataStream.length === 0) return;

    const dataPart = dataStream.at(-1) as DataUIPart<any>;

    if (dataPart.type === 'data-append-in-flight-message') {
      const message = JSON.parse(dataPart.data) as UIMessage;
      setMessages([...messages, message]);
    }
  }, [messages, setMessages, dataStream]);
}
