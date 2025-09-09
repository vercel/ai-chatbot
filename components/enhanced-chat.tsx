'use client';

import { useState } from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useSWRConfig } from 'swr';
import { unstable_serialize } from 'swr/infinite';

import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from '@/components/ai-elements/conversation';
import { Message, MessageContent } from '@/components/ai-elements/message';
import {
  PromptInput,
  PromptInputButton,
  PromptInputModelSelect,
  PromptInputModelSelectContent,
  PromptInputModelSelectItem,
  PromptInputModelSelectTrigger,
  PromptInputModelSelectValue,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputToolbar,
  PromptInputTools,
} from '@/components/ai-elements/prompt-input';
import { Actions, Action } from '@/components/ai-elements/actions';
import { Response } from '@/components/ai-elements/response';
import {
  Source,
  Sources,
  SourcesContent,
  SourcesTrigger,
} from '@/components/ai-elements/sources';
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from '@/components/ai-elements/reasoning';
import { Loader } from '@/components/ai-elements/loader';

import {
  fetchWithErrorHandlers,
  generateUUID,
} from '@/lib/utils';
import { getChatHistoryPaginationKey } from './sidebar-history';
import { ChatHeader } from './chat-header';
import { useDataStream } from './data-stream-provider';
import { toast } from './toast';
import { ChatSDKError } from '@/lib/errors';
import { RefreshCcwIcon, CopyIcon, GlobeIcon } from 'lucide-react';
import type { Session } from 'next-auth';
import type { VisibilityType } from './visibility-selector';
import type { ChatMessage, Attachment } from '@/lib/types';
import type { Vote } from '@/lib/db/schema';
import { chatModels } from '@/lib/ai/models';

interface EnhancedChatProps {
  id: string;
  initialMessages: ChatMessage[];
  initialChatModel: string;
  initialVisibilityType: VisibilityType;
  isReadonly: boolean;
  session: Session;
  autoResume: boolean;
  votes?: Vote[];
}

export function EnhancedChat({
  id,
  initialMessages,
  initialChatModel,
  initialVisibilityType,
  isReadonly,
  session,
  autoResume,
  votes = [],
}: EnhancedChatProps) {
  const [input, setInput] = useState<string>('');
  const [attachments, setAttachments] = useState<Array<Attachment>>([]);
  const [webSearch, setWebSearch] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string>(initialChatModel);

  const { mutate } = useSWRConfig();
  const { setDataStream } = useDataStream();

  const {
    messages,
    setMessages,
    sendMessage,
    status,
    stop,
    regenerate,
    resumeStream,
  } = useChat<ChatMessage>({
    id,
    messages: initialMessages,
    experimental_throttle: 100,
    generateId: generateUUID,
    transport: new DefaultChatTransport({
      api: '/api/chat',
      fetch: fetchWithErrorHandlers,
      prepareSendMessagesRequest({ messages, id, body }) {
        return {
          body: {
            id,
            message: messages.at(-1),
            selectedChatModel: selectedModel,
            selectedVisibilityType: initialVisibilityType,
            webSearch,
            ...body,
          },
        };
      },
    }),
    onData: (dataPart) => {
      setDataStream((ds) => (ds ? [...ds, dataPart] : []));
    },
    onFinish: () => {
      mutate(unstable_serialize(getChatHistoryPaginationKey));
    },
    onError: (error) => {
      if (error instanceof ChatSDKError) {
        toast({
          type: 'error',
          description: error.message,
        });
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      sendMessage({
        role: 'user' as const,
        parts: [{ type: 'text', text: input }],
      });
      setInput('');
    }
  };

  return (
    <div className="flex flex-col min-w-0 h-dvh bg-background">
      <ChatHeader
        chatId={id}
        selectedVisibilityType={initialVisibilityType}
        isReadonly={isReadonly}
        session={session}
      />

      <div className="relative flex-1 overflow-hidden">
        <Conversation className="h-full mx-auto w-full md:max-w-3xl">
          <ConversationContent>
            {messages.map((message) => (
              <div key={message.id}>
                {message.role === 'assistant' &&
                  message.parts.filter((part) => part.type === 'source-url')
                    .length > 0 && (
                    <Sources>
                      <SourcesTrigger
                        count={
                          message.parts.filter(
                            (part) => part.type === 'source-url',
                          ).length
                        }
                      />
                      <SourcesContent>
                        {message.parts
                          .filter((part) => part.type === 'source-url')
                          .map((part: any, i) => (
                            <Source
                              key={`${message.id}-${i}`}
                              href={part.url}
                              title={part.title || part.url}
                            />
                          ))}
                      </SourcesContent>
                    </Sources>
                  )}
                {message.parts.map((part: any, i) => {
                  switch (part.type) {
                    case 'text':
                      return (
                        <div key={`${message.id}-${i}`}>
                          <Message from={message.role}>
                            <MessageContent>
                              <Response>{part.text}</Response>
                            </MessageContent>
                          </Message>
                          {message.role === 'assistant' &&
                            message === messages[messages.length - 1] &&
                            i === message.parts.length - 1 &&
                            !isReadonly && (
                              <Actions className="mt-2">
                                <Action
                                  onClick={() => regenerate()}
                                  label="Repetir"
                                >
                                  <RefreshCcwIcon className="size-3" />
                                </Action>
                                <Action
                                  onClick={() =>
                                    navigator.clipboard.writeText(part.text)
                                  }
                                  label="Copiar"
                                >
                                  <CopyIcon className="size-3" />
                                </Action>
                              </Actions>
                            )}
                        </div>
                      );
                    case 'reasoning':
                      return (
                        <Reasoning
                          key={`${message.id}-${i}`}
                          className="w-full"
                          isStreaming={
                            status === 'streaming' &&
                            i === message.parts.length - 1 &&
                            message.id === messages.at(-1)?.id
                          }
                        >
                          <ReasoningTrigger />
                          <ReasoningContent>{part.text}</ReasoningContent>
                        </Reasoning>
                      );
                    default:
                      return null;
                  }
                })}
              </div>
            ))}
            {status === 'streaming' && <Loader />}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>
      </div>

      <div className="sticky bottom-0 flex gap-2 px-4 pb-4 mx-auto w-full bg-background md:pb-6 md:max-w-3xl z-[1] border-t-0">
        {!isReadonly && (
          <PromptInput onSubmit={handleSubmit} className="w-full">
            <PromptInputTextarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Envie uma mensagem..."
            />
            <PromptInputToolbar>
              <PromptInputTools>
                <PromptInputButton
                  variant={webSearch ? 'default' : 'ghost'}
                  onClick={() => setWebSearch(!webSearch)}
                >
                  <GlobeIcon size={16} />
                  <span>Pesquisar na web</span>
                </PromptInputButton>
                <PromptInputModelSelect
                  onValueChange={(value) => {
                    setSelectedModel(value);
                  }}
                  value={selectedModel}
                >
                  <PromptInputModelSelectTrigger>
                    <PromptInputModelSelectValue />
                  </PromptInputModelSelectTrigger>
                  <PromptInputModelSelectContent>
                    {chatModels.map((model) => (
                      <PromptInputModelSelectItem
                        key={model.id}
                        value={model.id}
                      >
                        {model.name}
                      </PromptInputModelSelectItem>
                    ))}
                  </PromptInputModelSelectContent>
                </PromptInputModelSelect>
              </PromptInputTools>
              <PromptInputSubmit
                disabled={!input.trim()}
                status={status === 'streaming' ? 'streaming' : status}
              />
            </PromptInputToolbar>
          </PromptInput>
        )}
      </div>
    </div>
  );
}
