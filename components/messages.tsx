import { ChatRequestOptions, Message } from 'ai';
import { PreviewMessage, ThinkingMessage } from './message';
import { useScrollToBottom } from './use-scroll-to-bottom';
import { Overview } from './overview';
import { memo, useCallback, useMemo } from 'react';
import { Vote } from '@/lib/db/schema';
import equal from 'fast-deep-equal';

interface MessagesProps {
  chatId: string;
  isLoading: boolean;
  votes: Array<Vote> | undefined;
  messages: Array<Message>;
  setMessages: (
    messages: Message[] | ((messages: Message[]) => Message[]),
  ) => void;
  reload: (
    chatRequestOptions?: ChatRequestOptions,
  ) => Promise<string | null | undefined>;
  isReadonly: boolean;
  isArtifactVisible: boolean;
}

function PureMessages({
  chatId,
  isLoading,
  votes,
  messages,
  setMessages,
  reload,
  isReadonly,
}: MessagesProps) {
  const [messagesContainerRef, messagesEndRef] =
    useScrollToBottom<HTMLDivElement>();

  // Pre-compute votes map for O(1) lookup instead of O(n) finds
  const votesMap = useMemo(() => {
    if (!votes) return new Map();
    return new Map(votes.map(vote => [vote.messageId, vote]));
  }, [votes]);
  
  // Create a memoized message renderer to prevent recreating function on each render
  const renderMessage = useCallback((message: Message, index: number) => (
    <PreviewMessage
      key={message.id}
      chatId={chatId}
      message={message}
      isLoading={isLoading && messages.length - 1 === index}
      vote={votesMap.get(message.id)}
      setMessages={setMessages}
      reload={reload}
      isReadonly={isReadonly}
    />
  ), [chatId, isLoading, messages.length, votesMap, setMessages, reload, isReadonly]);
  
  return (
    <div
      ref={messagesContainerRef}
      className="flex flex-col min-w-0 gap-6 flex-1 overflow-y-scroll pt-4"
    >
      {messages.length === 0 && <Overview />}

      {messages.map(renderMessage)}

      {isLoading &&
        messages.length > 0 &&
        messages[messages.length - 1].role === 'user' && <ThinkingMessage />}

      <div
        ref={messagesEndRef}
        className="shrink-0 min-w-[24px] min-h-[24px]"
      />
    </div>
  );
}

export const Messages = memo(PureMessages, (prevProps, nextProps) => {
  // Fast path - return true to skip re-render when both artifacts are visible
  if (prevProps.isArtifactVisible && nextProps.isArtifactVisible) return true;

  // Quick equality checks before deep comparison
  if (prevProps.isLoading !== nextProps.isLoading) return false;
  if (prevProps.isReadonly !== nextProps.isReadonly) return false;
  if (prevProps.chatId !== nextProps.chatId) return false;
  
  // Special case handling for loading state
  if (prevProps.isLoading && nextProps.isLoading) return false;
  
  // Message-specific checks
  if (prevProps.messages.length !== nextProps.messages.length) return false;
  
  // Use reference equality first if possible
  if (prevProps.messages === nextProps.messages) return true;
  
  // Fall back to deep equality check for messages and votes
  if (!equal(prevProps.messages, nextProps.messages)) return false;
  if (!equal(prevProps.votes, nextProps.votes)) return false;

  return true;
});
