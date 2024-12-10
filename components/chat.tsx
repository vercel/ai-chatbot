'use client';

import type { Attachment, Message } from 'ai';
import { useChat } from 'ai/react';
import { AnimatePresence } from 'framer-motion';
import { User } from 'next-auth';
import { useState } from 'react';
import useSWR, { useSWRConfig } from 'swr';
import { useWindowSize } from 'usehooks-ts';

import { ChatHeader } from '@/components/chat-header';
import type { Vote } from '@/lib/db/schema';
import { fetcher } from '@/lib/utils';

import { Block, type UIBlock } from './block';
import { BlockStreamHandler } from './block-stream-handler';
import { DeployDialog } from './deploy-dialog';
import { MultimodalInput } from './multimodal-input';
import { Messages } from './messages';
import { VisibilityType } from './visibility-selector';

export function Chat({
  id,
  initialMessages,
  selectedModelId,
  user,
  selectedVisibilityType,
  isReadonly,
}: {
  id: string;
  initialMessages: Array<Message>;
  selectedModelId: string;
  user: User | undefined;
  selectedVisibilityType: VisibilityType;
  isReadonly: boolean;
}) {
  const { mutate } = useSWRConfig();

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
    data: streamingData,
  } = useChat({
    id,
    body: { id, modelId: selectedModelId },
    initialMessages,
    onFinish: () => {
      mutate('/api/history');
    },
    onError: (error) => {
      if (error.message.startsWith('Too many requests')) {
        setIsDeployDialogOpen(true);
      }
    },
  });

  const { width: windowWidth = 1920, height: windowHeight = 1080 } =
    useWindowSize();

  const [block, setBlock] = useState<UIBlock>({
    documentId: 'init',
    content: '',
    title: '',
    status: 'idle',
    isVisible: false,
    boundingBox: {
      top: windowHeight / 4,
      left: windowWidth / 4,
      width: 250,
      height: 50,
    },
  });

  const { data: votes } = useSWR<Array<Vote>>(
    id !== 'guest' ? `/api/vote?chatId=${id}` : null,
    fetcher,
  );

  const [attachments, setAttachments] = useState<Array<Attachment>>([]);
  const [isDeployDialogOpen, setIsDeployDialogOpen] = useState(false);

  return (
    <>
      <div className="flex flex-col min-w-0 h-dvh bg-background">
        <ChatHeader
          chatId={id}
          selectedModelId={selectedModelId}
          selectedVisibilityType={selectedVisibilityType}
          isReadonly={isReadonly}
          user={user}
          setMessages={setMessages}
        />

        <Messages
          chatId={id}
          block={block}
          setBlock={setBlock}
          isLoading={isLoading}
          votes={votes}
          messages={messages}
          setMessages={setMessages}
          reload={reload}
          isReadonly={isReadonly}
          user={user}
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
              selectedModelId={selectedModelId}
            />
          )}
        </form>
      </div>

      <AnimatePresence>
        {block?.isVisible && (
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
            block={block}
            setBlock={setBlock}
            messages={messages}
            setMessages={setMessages}
            reload={reload}
            votes={votes}
            user={user}
            selectedModelId={selectedModelId}
            isReadonly={isReadonly}
          />
        )}
      </AnimatePresence>

      <BlockStreamHandler streamingData={streamingData} setBlock={setBlock} />

      <DeployDialog
        isOpen={isDeployDialogOpen}
        setIsOpen={setIsDeployDialogOpen}
      />
    </>
  );
}
