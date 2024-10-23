'use client';

import { Attachment, Message } from 'ai';
import { useChat } from 'ai/react';
import { SquarePen } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { Message as PreviewMessage } from '@/components/custom/message';
import { useScrollToBottom } from '@/components/custom/use-scroll-to-bottom';
import { cn } from '@/lib/utils';

import { Button } from '../ui/button';
import { SidebarTrigger, useSidebar } from '../ui/sidebar';
import { BetterTooltip, Tooltip } from '../ui/tooltip';
import { MultimodalInput } from './multimodal-input';
import { Overview } from './overview';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function Chat({
  id,
  initialMessages,
}: {
  id: string;
  initialMessages: Array<Message>;
}) {
  const { messages, handleSubmit, input, setInput, append, isLoading, stop } =
    useChat({
      body: { id },
      initialMessages,
      onFinish: () => {
        window.history.replaceState({}, '', `/chat/${id}`);
      },
    });
  const { open } = useSidebar();

  const [messagesContainerRef, messagesEndRef] =
    useScrollToBottom<HTMLDivElement>();

  const [attachments, setAttachments] = useState<Array<Attachment>>([]);

  return (
    <div className="flex flex-row justify-center pb-4 md:pb-8 h-dvh bg-background">
      <div className="flex flex-col justify-between items-center gap-4">
        <div className="w-full flex flex-row gap-1 items-center p-2">
          {open ? null : (
            <>
              <BetterTooltip content="Open Sidebar" align="start">
                <SidebarTrigger />
              </BetterTooltip>
              <BetterTooltip content="New Chat" align="start">
                <Button variant="ghost" size="icon" asChild>
                  <Link href="/">
                    <SquarePen className="size-5" />
                  </Link>
                </Button>
              </BetterTooltip>
            </>
          )}
          <Select defaultValue="nextgpt-4o">
            <SelectTrigger className="w-auto text-lg font-semibold tracking-tight text-foreground/80 border-none hover:bg-muted">
              <SelectValue placeholder="NextGPT 4o " />
            </SelectTrigger>
            <SelectContent>
              <SelectItem
                value="nextgpt-4o"
                className="text-lg font-semibold tracking-tight text-foreground/80 "
              >
                NextGPT 4o
              </SelectItem>
              <SelectItem
                value="nextgpt-4o-mini"
                className="text-lg font-semibold tracking-tight text-foreground/80"
              >
                NextGPT 4o mini
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div
          ref={messagesContainerRef}
          className={cn(
            'flex flex-col gap-4 h-full items-center overflow-y-scroll',
            open && 'w-[calc(100dvw-var(--sidebar-width))]',
            !open && 'w-dvw'
          )}
        >
          {messages.length === 0 && <Overview />}

          {messages.map((message) => (
            <PreviewMessage
              key={message.id}
              role={message.role}
              content={message.content}
              attachments={message.experimental_attachments}
              toolInvocations={message.toolInvocations}
            />
          ))}

          <div
            ref={messagesEndRef}
            className="shrink-0 min-w-[24px] min-h-[24px]"
          />
        </div>

        <form className="flex flex-row gap-2 relative items-end w-full md:max-w-[500px] max-w-[calc(100dvw-32px) px-4 md:px-0">
          <MultimodalInput
            input={input}
            setInput={setInput}
            handleSubmit={handleSubmit}
            isLoading={isLoading}
            stop={stop}
            attachments={attachments}
            setAttachments={setAttachments}
            messages={messages}
            append={append}
          />
        </form>
      </div>
    </div>
  );
}
