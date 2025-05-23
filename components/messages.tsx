import type { UIMessage } from 'ai';
import { PreviewMessage, ThinkingMessage } from './message';
import { useScrollToBottom } from './use-scroll-to-bottom';
import { Greeting } from './greeting';
import { memo } from 'react';
import type { Vote, DBMessage } from '@/lib/db/schema';
import equal from 'fast-deep-equal';
import type { UseChatHelpers } from '@ai-sdk/react';

interface MessagesProps {
  chatId: string;
  status: UseChatHelpers['status'];
  votes: Array<Vote> | undefined;
  messages: Array<UIMessage>;
  setMessages: UseChatHelpers['setMessages'];
  reload: UseChatHelpers['reload'];
  isReadonly: boolean;
  isArtifactVisible: boolean;
  selectedChatModel: string;
}

function PureMessages({
  chatId,
  status,
  votes,
  messages,
  setMessages,
  reload,
  isReadonly,
  isArtifactVisible,
  selectedChatModel,
}: MessagesProps) {
  const [messagesContainerRef, messagesEndRef] =
    useScrollToBottom<HTMLDivElement>();

  let showThinking = false;
  if (messages.length > 0) {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage.role === 'user') {
      if (selectedChatModel.startsWith('n8n')) {
        showThinking = true;
      } else {
        showThinking = status === 'submitted';
      }
    }
    if (
      selectedChatModel.startsWith('n8n') &&
      lastMessage.role === 'assistant' &&
      (lastMessage.content === 'Thinking...' ||
        (Array.isArray(lastMessage.parts) &&
          lastMessage.parts.some((p: any) => p.text === 'Thinking...'))) &&
      (lastMessage as any).status !== 'complete'
    ) {
      showThinking = true;
    }
  }

  return (
    <div
      ref={messagesContainerRef}
      className="flex flex-col min-w-0 gap-6 flex-1 overflow-y-scroll pt-4"
    >
      {messages.length === 0 && <Greeting />}

      {messages.map((message, index) => (
        <PreviewMessage
          key={message.id}
          chatId={chatId}
          message={message}
          messages={messages}
          isLoading={
            status === 'streaming' &&
            messages.length - 1 === index &&
            !selectedChatModel.startsWith('n8n')
          }
          vote={
            votes
              ? votes.find((vote) => vote.messageId === message.id)
              : undefined
          }
          setMessages={setMessages}
          reload={reload}
          status={status}
          isReadonly={isReadonly}
          index={index}
        />
      ))}

      {showThinking && <ThinkingMessage />}

      <div
        ref={messagesEndRef}
        className="shrink-0 min-w-[24px] min-h-[24px]"
      />
    </div>
  );
}

export const Messages = memo(PureMessages, (prevProps, nextProps) => {
  if (prevProps.isArtifactVisible && nextProps.isArtifactVisible) return true;
  if (prevProps.status !== nextProps.status) return false;
  if (prevProps.messages.length !== nextProps.messages.length) return false;
  if (!equal(prevProps.messages, nextProps.messages)) return false;
  if (!equal(prevProps.votes, nextProps.votes)) return false;
  if (prevProps.selectedChatModel !== nextProps.selectedChatModel) return false;

  return true;
});
