import type { ChatMessage, Document } from '@/lib/types';
import { useChat, type UseChatHelpers } from '@ai-sdk/react';
import { useEffect, useMemo } from 'react';

export const useRecentDocumentPart = ({
  chatId,
  status,
}: { chatId: string; status: UseChatHelpers<ChatMessage>['status'] }) => {
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

  return { recentDocumentPart };
};
