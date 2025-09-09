'use client';

import { useEffect, useRef, useState } from 'react';
import { FixedSizeList } from 'react-window';
import { PreviewMessage, ThinkingMessage } from './message';
import { motion } from 'framer-motion';
import { useWindowSize } from 'usehooks-ts';
import type { UseChatHelpers } from '@ai-sdk/react';
import type { ChatMessage } from '@/lib/types';
import type { Vote } from '@/lib/db/schema';

interface VirtualizedMessagesProps {
  chatId: string;
  messages: ChatMessage[];
  votes?: Vote[];
  status: UseChatHelpers<ChatMessage>['status'];
  setMessages: UseChatHelpers<ChatMessage>['setMessages'];
  regenerate: UseChatHelpers<ChatMessage>['regenerate'];
  isReadonly: boolean;
  isArtifactVisible: boolean;
  containerRef: React.RefObject<HTMLDivElement>;
}

export function VirtualizedMessages({
  chatId,
  messages,
  votes = [],
  status,
  setMessages,
  regenerate,
  isReadonly,
  isArtifactVisible,
  containerRef,
}: VirtualizedMessagesProps) {
  const { height: windowHeight } = useWindowSize();
  const listRef = useRef<FixedSizeList>(null);
  const sizeMap = useRef<{ [key: number]: number }>({});
  const [messageHeights, setMessageHeights] = useState<{
    [key: string]: number;
  }>({});

  // Estima a altura das mensagens para pre-caching (podemos ajustar com base na complexidade da mensagem)
  const getEstimatedHeight = (index: number): number => {
    const messageId = messages[index]?.id;

    if (messageId && messageHeights[messageId]) {
      return messageHeights[messageId];
    }

    // Altura padrão estimada com base no tipo da mensagem
    const message = messages[index];
    if (!message) return 100;

    const isUserMessage = message.role === 'user';
    const hasAttachments = message.parts.some((part) => part.type === 'file');

    if (isUserMessage && !hasAttachments) {
      return 100; // Mensagens de usuário são geralmente mais simples
    }

    // Estimar com base no número de partes e tipos de conteúdo
    return 150 + message.parts.length * 50;
  };

  // Quando o tamanho da mensagem é realmente calculado, atualizamos o cache
  const setMeasuredHeight = (index: number, height: number) => {
    const messageId = messages[index]?.id;
    if (messageId) {
      setMessageHeights((prev) => ({
        ...prev,
        [messageId]: height,
      }));
    }

    sizeMap.current = {
      ...sizeMap.current,
      [index]: height,
    };

    listRef.current?.resetAfterIndex(index);
  };

  // Recalcular lista quando mensagens são alteradas
  useEffect(() => {
    listRef.current?.resetAfterIndex(0);
  }, [messages]);

  return (
    <div className="relative flex-1 overflow-y-auto" ref={containerRef}>
      <FixedSizeList
        ref={listRef}
        height={windowHeight * 0.75}
        itemCount={messages.length + (status === 'streaming' ? 1 : 0)}
        itemSize={120} // valor fixo, pode ser ajustado
        width={"100%"}
        overscanCount={3}
        style={{
          overflowX: 'hidden',
          paddingLeft: '1rem',
          paddingRight: '1rem',
          marginTop: '1rem',
        }}
      >
        {({ index, style }: { index: number; style: React.CSSProperties }) => {
          if (index === messages.length && status === 'streaming') {
            return (
              <div style={style}>
                <ThinkingMessage />
              </div>
            );
          }
          const message = messages[index];
          if (!message) return null;
          const vote = votes.find((vote) => vote.messageId === message.id);
          return (
            <div style={{ ...style, height: 'auto' }}>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <PreviewMessage
                  chatId={chatId}
                  message={message}
                  vote={vote}
                  isLoading={false}
                  setMessages={setMessages}
                  regenerate={regenerate}
                  isReadonly={isReadonly}
                  requiresScrollPadding={index === messages.length - 1}
                  isArtifactVisible={isArtifactVisible}
                />
              </motion.div>
            </div>
          );
        }}
      </FixedSizeList>
      {/* Elemento para detecção do fim do scroll */}
      <div id="messages-end" className="h-px" />
    </div>
  );
}
