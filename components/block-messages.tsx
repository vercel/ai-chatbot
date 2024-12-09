import { Dispatch, memo, SetStateAction } from 'react';
import { UIBlock } from './block';
import { PreviewMessage } from './message';
import { useScrollToBottom } from './use-scroll-to-bottom';
import { Vote } from '@/lib/db/schema';
import { ChatRequestOptions, Message } from 'ai';

interface BlockMessagesProps {
  chatId: string;
  block: UIBlock;
  setBlock: Dispatch<SetStateAction<UIBlock>>;
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
}

function PureBlockMessages({
  chatId,
  block,
  setBlock,
  isLoading,
  votes,
  messages,
  setMessages,
  reload,
  isReadonly,
}: BlockMessagesProps) {
  const [messagesContainerRef, messagesEndRef] =
    useScrollToBottom<HTMLDivElement>();

  return (
    <div
      ref={messagesContainerRef}
      className="flex flex-col gap-4 h-full items-center overflow-y-scroll px-4 pt-20"
    >
      {messages.map((message, index) => (
        <PreviewMessage
          chatId={chatId}
          key={message.id}
          message={message}
          block={block}
          setBlock={setBlock}
          isLoading={isLoading && index === messages.length - 1}
          vote={
            votes
              ? votes.find((vote) => vote.messageId === message.id)
              : undefined
          }
          setMessages={setMessages}
          reload={reload}
          isReadonly={isReadonly}
        />
      ))}

      <div
        ref={messagesEndRef}
        className="shrink-0 min-w-[24px] min-h-[24px]"
      />
    </div>
  );
}

function areEqual(
  prevProps: BlockMessagesProps,
  nextProps: BlockMessagesProps,
) {
  if (
    prevProps.block.status === 'streaming' &&
    nextProps.block.status === 'streaming'
  ) {
    return true;
  }

  return false;
}

export const BlockMessages = memo(PureBlockMessages, areEqual);
