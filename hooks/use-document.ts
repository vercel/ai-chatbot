'use client';

import type { ChatMessage, Document } from '@/lib/types';
import { useChat, type UseChatHelpers } from '@ai-sdk/react';
import { useEffect, useMemo } from 'react';
import useSWR from 'swr';
import { useDocumentLayout } from './use-document-layout';

export const useRecentDocumentPart = ({
  chatId,
  status,
}: { chatId: string; status: UseChatHelpers<ChatMessage>['status'] }) => {
  const { documentLayout } = useDocumentLayout();

  const { messages, resumeStream } = useChat<ChatMessage>({
    id: chatId,
  });

  useEffect(() => {
    if (status === 'streaming') {
      resumeStream();
    }
  }, [status, resumeStream]);

  const recentDocumentPart: Partial<Document> | null = useMemo(() => {
    const recentAssistantMessage = messages.findLast(
      (message) => message.role === 'assistant',
    );

    if (!recentAssistantMessage) return null;

    const recentDocumentPart = recentAssistantMessage.parts.find(
      (part) => part.type === 'data-document',
    );

    if (!recentDocumentPart) return null;

    return recentDocumentPart.data;
  }, [messages]);

  const { data: localDocumentMetadata, mutate: setLocalDocumentMetadata } =
    useSWR<any>(
      () =>
        documentLayout?.selectedDocumentId
          ? `artifact-metadata-${documentLayout.selectedDocumentId}`
          : null,
      null,
      {
        fallbackData: null,
      },
    );

  return {
    recentDocumentPart,
    metadata: localDocumentMetadata,
    setMetadata: setLocalDocumentMetadata,
  };
};
