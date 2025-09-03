import { useEffect, useRef, useState } from 'react';

import type { ChatMessage } from '@/lib/types';
import type { UseChatHelpers } from '@ai-sdk/react';
import { useScrollToBottom } from './use-scroll-to-bottom';

export function useMessages({
  chatId,
  status,
  messages,
}: {
  chatId: string;
  status: UseChatHelpers<ChatMessage>['status'];
  messages: ChatMessage[];
}) {
  const {
    containerRef,
    endRef,
    isAtBottom,
    scrollToBottom,
    onViewportEnter,
    onViewportLeave,
  } = useScrollToBottom();

  const [hasSentMessage, setHasSentMessage] = useState(false);
  const previousMessageCountRef = useRef(0);
  const lastMessageContentRef = useRef<string>('');

  useEffect(() => {
    if (chatId) {
      scrollToBottom('instant');
      setHasSentMessage(false);
      previousMessageCountRef.current = 0;
      lastMessageContentRef.current = '';
    }
  }, [chatId, scrollToBottom]);

  useEffect(() => {
    if (status === 'submitted') {
      setHasSentMessage(true);
    }
  }, [status]);

  // Auto-scroll when new messages arrive or content changes during streaming
  useEffect(() => {
    const currentMessageCount = messages.length;
    const previousMessageCount = previousMessageCountRef.current;
    
    // If we have new messages and we're streaming, scroll to bottom
    if (currentMessageCount > previousMessageCount && status === 'streaming') {
      scrollToBottom('smooth');
    }
    
    // If we're streaming and the user is at the bottom, scroll when content changes
    if (status === 'streaming' && isAtBottom && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage && lastMessage.role === 'assistant') {
        // Create a content hash that includes all parts of the message
        const contentHash = JSON.stringify(lastMessage.parts?.map(part => ({
          type: part.type,
          text: part.type === 'text' ? part.text : '',
          toolCallId: part.type.startsWith('tool-') ? (part as any).toolCallId : '',
          state: part.type.startsWith('tool-') ? (part as any).state : '',
        })) || []);
        
        // If content has changed and we're at the bottom, scroll
        if (contentHash !== lastMessageContentRef.current && contentHash.length > 0) {
          scrollToBottom('smooth');
          lastMessageContentRef.current = contentHash;
        }
      }
    }
    
    previousMessageCountRef.current = currentMessageCount;
  }, [messages, status, scrollToBottom, isAtBottom]);

  return {
    containerRef,
    endRef,
    isAtBottom,
    scrollToBottom,
    onViewportEnter,
    onViewportLeave,
    hasSentMessage,
  };
}
