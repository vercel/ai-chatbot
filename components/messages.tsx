/**
 * @file components/messages.tsx
 * @description Компонент для отображения списка сообщений в чате.
 * @version 1.2.0
 * @date 2025-06-06
 * @updated Удален импорт и проп `Vote`. Исправлен импорт из './message'.
 */
import type { UIMessage } from 'ai'
import { PreviewMessage, ThinkingMessage } from './message'
import { Greeting } from './greeting'
import { memo } from 'react'
import equal from 'fast-deep-equal'
import type { UseChatHelpers } from '@ai-sdk/react'
import { motion } from 'framer-motion'
import { useMessages } from '@/hooks/use-messages'

interface MessagesProps {
  chatId: string;
  status: UseChatHelpers['status'];
  votes: undefined; // Removed
  messages: Array<UIMessage>;
  setMessages: UseChatHelpers['setMessages'];
  reload: UseChatHelpers['reload'];
  isReadonly: boolean;
  isArtifactVisible: boolean;
}

function PureMessages ({
  chatId,
  status,
  messages,
  setMessages,
  reload,
  isReadonly,
}: MessagesProps) {
  const {
    containerRef: messagesContainerRef,
    endRef: messagesEndRef,
    onViewportEnter,
    onViewportLeave,
    hasSentMessage,
  } = useMessages({
    chatId,
    status,
  })

  return (
    <div
      ref={messagesContainerRef}
      className="flex flex-col min-w-0 gap-6 flex-1 overflow-y-scroll pt-4 relative"
    >
      {messages.length === 0 && <Greeting/>}

      {messages.map((message, index) => (
        <PreviewMessage
          key={message.id}
          chatId={chatId}
          message={message}
          isLoading={status === 'streaming' && messages.length - 1 === index}
          vote={undefined} // Removed
          setMessages={setMessages}
          reload={reload}
          isReadonly={isReadonly}
          requiresScrollPadding={
            hasSentMessage && index === messages.length - 1
          }
        />
      ))}

      {status === 'submitted' &&
        messages.length > 0 &&
        messages[messages.length - 1].role === 'user' && <ThinkingMessage/>}

      <motion.div
        ref={messagesEndRef}
        className="shrink-0 min-w-[24px] min-h-[24px]"
        onViewportLeave={onViewportLeave}
        onViewportEnter={onViewportEnter}
      />
    </div>
  )
}

export const Messages = memo(PureMessages, (prevProps, nextProps) => {
  if (prevProps.status !== nextProps.status) return false
  if (prevProps.messages.length !== nextProps.messages.length) return false
  if (!equal(prevProps.messages, nextProps.messages)) return false

  // Votes are removed, so no need to compare them.
  // if (!equal(prevProps.votes, nextProps.votes)) return false;

  // This condition was blocking updates when the artifact panel was open.
  // It should be safe to remove as other checks handle memoization correctly.
  // if (prevProps.isArtifactVisible && nextProps.isArtifactVisible) return true;

  return true
})

// END OF: components/messages.tsx
