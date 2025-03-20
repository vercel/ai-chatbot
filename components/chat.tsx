'use client';

import type { Attachment, Message } from 'ai';
import { useChat } from '@ai-sdk/react';
import { User } from 'next-auth';
import { useEffect, useState } from 'react';
import useSWR, { useSWRConfig } from 'swr';

import { ChatHeader } from '@/components/chat-header';
import type { Vote } from '@/lib/db/schema';
import { fetcher, generateUUID } from '@/lib/utils';

import { Block } from './block';
import { MultimodalInput } from './multimodal-input';
import { Messages } from './messages';
import { VisibilityType } from './visibility-selector';
import { useBlockSelector } from '@/hooks/use-block';
import { DeployDialog } from './deploy-dialog';
import { toast } from 'sonner';
import { useSearchParams } from 'next/navigation';

export function Chat({
  id,
  initialMessages,
  user,
  selectedChatModelId,
  selectedVisibilityType,
  isReadonly,
}: {
  id: string;
  initialMessages: Array<Message>;
  user: User | undefined;
  selectedChatModelId: string;
  selectedVisibilityType: VisibilityType;
  isReadonly: boolean;
}) {
  const { mutate } = useSWRConfig();
  const searchParams = useSearchParams();
  const query = searchParams.get('query');

  const {
    messages,
    setMessages,
    handleSubmit,
    input,
    setInput,
    append,
    isLoading,
    stop,
    reload,
  } = useChat({
    id,
    body: { id, selectedChatModelId: selectedChatModelId },
    initialMessages,
    experimental_throttle: 100,
    sendExtraMessageFields: true,
    generateId: generateUUID,
    onFinish: () => {
      mutate('/api/history');
    },
    onError: (error) => {
      if (error.message.startsWith('Too many requests')) {
        setIsDeployDialogOpen(true);
      } else {
        toast.error('An error occured, please try again!');
      }
    },
  });

  const { data: votes } = useSWR<Array<Vote>>(
    id !== 'guest' ? `/api/vote?chatId=${id}` : null,
    fetcher,
  );

  const [attachments, setAttachments] = useState<Array<Attachment>>([]);
  const [isDeployDialogOpen, setIsDeployDialogOpen] = useState(false);
  const isBlockVisible = useBlockSelector((state) => state.isVisible);

  const [hasAppendedQuery, setHasAppendedQuery] = useState(false);

  useEffect(() => {
    if (query && !hasAppendedQuery) {
      append({
        role: 'user',
        content: query,
      });

      setHasAppendedQuery(true);

      if (user) {
        window.history.replaceState({}, '', `/chat/${id}`);
      } else {
        window.history.replaceState({}, '', `/`);
      }
    }
  }, [query, append, hasAppendedQuery, user, id]);

  return (
    <>
      <div className="flex flex-col min-w-0 h-dvh bg-background">
        <ChatHeader
          chatId={id}
          isReadonly={isReadonly}
          user={user}
          setMessages={setMessages}
          selectedChatModelId={selectedChatModelId}
          selectedVisibilityType={selectedVisibilityType}
        />

        <Messages
          chatId={id}
          isLoading={isLoading}
          votes={votes}
          messages={messages}
          setMessages={setMessages}
          reload={reload}
          isReadonly={isReadonly}
          user={user}
          isBlockVisible={isBlockVisible}
        />

        <form className="flex mx-auto px-4 bg-background pb-4 md:pb-6 gap-2 w-full md:max-w-3xl">
          {!isReadonly && (
            <MultimodalInput
              chatId={id}
              input={input}
              setInput={setInput}
              handleSubmit={handleSubmit}
              isLoading={isLoading}
              stop={stop}
              attachments={attachments}
              setAttachments={setAttachments}
              messages={messages}
              setMessages={setMessages}
              append={append}
              user={user}
            />
          )}
        </form>
      </div>

      <Block
        chatId={id}
        input={input}
        setInput={setInput}
        handleSubmit={handleSubmit}
        isLoading={isLoading}
        stop={stop}
        attachments={attachments}
        setAttachments={setAttachments}
        append={append}
        messages={messages}
        setMessages={setMessages}
        reload={reload}
        votes={votes}
        user={user}
        selectedChatModelId={selectedChatModelId}
        isReadonly={isReadonly}
      />

      <DeployDialog
        isOpen={isDeployDialogOpen}
        setIsOpen={setIsDeployDialogOpen}
      />
    </>
  );
}
