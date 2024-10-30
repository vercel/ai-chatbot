'use client';

import { Attachment, Message } from 'ai';
import { useChat } from 'ai/react';
import { AnimatePresence } from 'framer-motion';
import { User } from 'next-auth';
import { useState } from 'react';
import { toast } from 'sonner';

import { ChatHeader } from '@/components/custom/chat-header';
import { Message as PreviewMessage } from '@/components/custom/message';
import { useScrollToBottom } from '@/components/custom/use-scroll-to-bottom';

import { Canvas, UICanvas } from './canvas';
import { CanvasStreamHandler } from './canvas-stream-handler';
import { DeployDialog } from './deploy-dialog';
import { MultimodalInput } from './multimodal-input';
import { Overview } from './overview';

export function Chat({
  id,
  initialMessages,
  selectedModelId,
  user,
}: {
  id: string;
  initialMessages: Array<Message>;
  selectedModelId: string;
  user: User | undefined;
}) {
  const {
    messages,
    setMessages,
    handleSubmit,
    input,
    setInput,
    append,
    isLoading,
    stop,
    data: streamingData,
  } = useChat({
    body: { id, modelId: selectedModelId },
    initialMessages,
    onFinish: () => {
      if (user) {
        window.history.replaceState({}, '', `/chat/${id}`);
      }
    },
    onError: (error) => {
      if (error.message.startsWith('Too many requests')) {
        setIsDeployDialogOpen(true);
      }
    },
  });

  const [messagesContainerRef, messagesEndRef] =
    useScrollToBottom<HTMLDivElement>();

  const [canvas, setCanvas] = useState<UICanvas | null>(null);
  const [attachments, setAttachments] = useState<Array<Attachment>>([]);
  const [isDeployDialogOpen, setIsDeployDialogOpen] = useState(false);

  return (
    <>
      <div className="flex flex-col min-w-0 h-dvh bg-background">
        <ChatHeader selectedModelId={selectedModelId} user={user} />

        <div
          ref={messagesContainerRef}
          className="flex flex-col min-w-0 gap-6 flex-1 overflow-y-scroll"
        >
          {messages.length === 0 && <Overview />}

          {messages.map((message) => (
            <PreviewMessage
              key={message.id}
              role={message.role}
              content={message.content}
              attachments={message.experimental_attachments}
              toolInvocations={message.toolInvocations}
              canvas={canvas}
              setCanvas={setCanvas}
            />
          ))}

          <div
            ref={messagesEndRef}
            className="shrink-0 min-w-[24px] min-h-[24px]"
          />
        </div>
        <form className="flex mx-auto px-4 bg-background pb-4 md:pb-6 gap-2 w-full md:max-w-3xl">
          <MultimodalInput
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
          />
        </form>
      </div>

      <AnimatePresence>
        {canvas && canvas.isVisible && (
          <Canvas
            input={input}
            setInput={setInput}
            handleSubmit={handleSubmit}
            isLoading={isLoading}
            stop={stop}
            attachments={attachments}
            setAttachments={setAttachments}
            append={append}
            canvas={canvas}
            setCanvas={setCanvas}
            messages={messages}
            setMessages={setMessages}
          />
        )}
      </AnimatePresence>

      <CanvasStreamHandler
        streamingData={streamingData}
        setCanvas={setCanvas}
      />

      <DeployDialog
        isOpen={isDeployDialogOpen}
        setIsOpen={setIsDeployDialogOpen}
      />
    </>
  );
}
