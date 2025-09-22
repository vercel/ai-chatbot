'use client';
import { AnimatePresence, motion } from 'framer-motion';
import { memo, useState } from 'react';
import type { ReactNode } from 'react';
import type { Vote } from '@/lib/db/schema';
import { DocumentToolResult } from './document';
import { Response } from './elements/response';
import { MessageContent } from './elements/message';
import {
  Tool,
  ToolHeader,
  ToolContent,
  ToolInput,
  ToolOutput,
} from './elements/tool';
import { MessageActions } from './message-actions';
import { PreviewAttachment } from './preview-attachment';
import { Weather } from './weather';
import equal from 'fast-deep-equal';
import { cn, sanitizeText } from '@/lib/utils';
import { MessageEditor } from './message-editor';
import { MessageReasoning } from './message-reasoning';
import { ChainOfThoughtBlock } from './chain-of-thought-block';
import { ChainOfThoughtPlaceholder } from './chain-of-thought-placeholder';
import type { UseChatHelpers } from '@ai-sdk/react';
import type { ChatMessage } from '@/lib/types';
import { useDataStream } from './data-stream-provider';
import { LoadingText } from './elements/loading-text';

// Type narrowing is handled by TypeScript's control flow analysis
// The AI SDK provides proper discriminated unions for tool calls

const PurePreviewMessage = ({
  chatId,
  message,
  vote,
  isLoading,
  setMessages,
  regenerate,
  isReadonly,
  requiresScrollPadding,
  isArtifactVisible,
}: {
  chatId: string;
  message: ChatMessage;
  vote: Vote | undefined;
  isLoading: boolean;
  setMessages: UseChatHelpers<ChatMessage>['setMessages'];
  regenerate: UseChatHelpers<ChatMessage>['regenerate'];
  isReadonly: boolean;
  requiresScrollPadding: boolean;
  isArtifactVisible: boolean;
}) => {
  const [mode, setMode] = useState<'view' | 'edit'>('view');

  const attachmentsFromMessage = message.parts.filter(
    (part) => part.type === 'file',
  );

  useDataStream();

  return (
    <AnimatePresence>
      <motion.div
        data-testid={`message-${message.role}`}
        className="w-full group/message"
        initial={{ y: 5, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        data-role={message.role}
      >
        <div
          className={cn('flex items-start gap-3', {
            'w-full': mode === 'edit',
            'max-w-xl ml-auto justify-end mr-6':
              message.role === 'user' && mode !== 'edit',
            'justify-start -ml-3': message.role === 'assistant',
          })}
        >
          <div
            className={cn('flex flex-col gap-2', {
              'min-h-96': message.role === 'assistant' && requiresScrollPadding,
              'w-full': message.role === 'assistant',
              'w-fit': message.role === 'user',
            })}
          >
            {attachmentsFromMessage.length > 0 && (
              <div
                data-testid={`message-attachments`}
                className="flex flex-row gap-2 justify-end"
              >
                {attachmentsFromMessage.map((attachment) => (
                  <PreviewAttachment
                    key={attachment.url}
                    attachment={{
                      name: attachment.filename ?? 'file',
                      contentType: attachment.mediaType,
                      url: attachment.url,
                    }}
                  />
                ))}
              </div>
            )}

            {(() => {
              // Identify a Chain-of-Thought range: from the first reasoning/tool part
              // up to (but not including) the first non-empty text part. This keeps
              // later reasoning steps inside the chain until the final answer text.
              const parts = message.parts ?? [];
              const isCoTPart = (p: any) => {
                const t = p?.type as string | undefined;
                if (!t) return false;
                if (t === 'reasoning') {
                  const txt = (p as any)?.text;
                  return typeof txt === 'string' && txt.trim().length > 0;
                }
                return t.startsWith('tool-');
              };

              let cotFirstIndex: number | null = null;
              let cotEndBoundary: number | null = null;
              for (let i = 0; i < parts.length; i++) {
                const p = parts[i];
                const t = p?.type as string | undefined;
                if (cotFirstIndex === null) {
                  if (isCoTPart(p)) cotFirstIndex = i;
                  continue;
                }
                if (
                  t === 'text' &&
                  typeof (p as any)?.text === 'string' &&
                  (p as any).text.trim().length > 0
                ) {
                  cotEndBoundary = i - 1; // stop before the first substantive text block
                  break;
                }
              }
              if (cotFirstIndex !== null && cotEndBoundary === null)
                cotEndBoundary = parts.length - 1;

              const elements: ReactNode[] = [];

              // While loading, if no CoT parts have arrived yet, render an immediate placeholder
              // so there is never a blank gap. It disappears as soon as a real CoT part appears.
              if (
                message.role === 'assistant' &&
                isLoading &&
                cotFirstIndex === null
              ) {
                elements.push(
                  <div key={`cot-placeholder-${message.id}`}>
                    <ChainOfThoughtPlaceholder />
                  </div>,
                );
              }

              elements.push(
                ...parts.map((part, index) => {
                  const { type } = part;
                  const key = `message-${message.id}-part-${index}`;

                  // Render the unified Chain-of-Thought block at the beginning of the first run
                  if (
                    cotFirstIndex !== null &&
                    cotEndBoundary !== null &&
                    index === cotFirstIndex
                  ) {
                    return (
                      <ChainOfThoughtBlock
                        key={`cot-${message.id}-${index}`}
                        message={message}
                        isLoading={isLoading}
                        isReadonly={isReadonly}
                      />
                    );
                  }

                  // Skip the rest of parts that belong to the CoT run
                  if (
                    cotFirstIndex !== null &&
                    cotEndBoundary !== null &&
                    index > cotFirstIndex &&
                    index <= cotEndBoundary
                  ) {
                    return null;
                  }

                  if (type === 'reasoning' && part.text?.trim().length > 0) {
                    return (
                      <MessageReasoning
                        key={key}
                        isLoading={isLoading}
                        reasoning={part.text}
                      />
                    );
                  }

                  if (type === 'text') {
                    if (mode === 'view') {
                      return (
                        <MessageContent
                          key={key}
                          data-testid="message-content"
                          className={cn('justify-start items-start text-left', {
                            'bg-primary text-primary-foreground':
                              message.role === 'user',
                            'bg-transparent -ml-4':
                              message.role === 'assistant',
                          })}
                        >
                          <Response>{sanitizeText(part.text)}</Response>
                        </MessageContent>
                      );
                    }

                    if (mode === 'edit') {
                      return (
                        <div
                          key={key}
                          className="flex flex-row gap-3 items-start w-full"
                        >
                          <div className="size-8" />
                          <div className="flex-1 min-w-0">
                            <MessageEditor
                              key={message.id}
                              message={message}
                              setMode={setMode}
                              setMessages={setMessages}
                              regenerate={regenerate}
                            />
                          </div>
                        </div>
                      );
                    }
                  }

                  if (type === 'tool-getWeather') {
                    const { toolCallId, state } = part;

                    return (
                      <Tool key={toolCallId} defaultOpen={true}>
                        <ToolHeader type="tool-getWeather" state={state} />
                        <ToolContent>
                          {state === 'input-available' && (
                            <ToolInput input={part.input} />
                          )}
                          {state === 'output-available' && (
                            <ToolOutput
                              output={
                                <Weather weatherAtLocation={part.output} />
                              }
                              errorText={undefined}
                            />
                          )}
                        </ToolContent>
                      </Tool>
                    );
                  }

                  if (type === 'tool-requestSuggestions') {
                    const { toolCallId, state } = part;

                    return (
                      <Tool key={toolCallId} defaultOpen={true}>
                        <ToolHeader
                          type="tool-requestSuggestions"
                          state={state}
                        />
                        <ToolContent>
                          {state === 'input-available' && (
                            <ToolInput input={part.input} />
                          )}
                          {state === 'output-available' && (
                            <ToolOutput
                              output={
                                'error' in part.output ? (
                                  <div className="p-2 text-red-500 rounded border">
                                    Error: {String(part.output.error)}
                                  </div>
                                ) : (
                                  <DocumentToolResult
                                    type="request-suggestions"
                                    result={part.output}
                                    isReadonly={isReadonly}
                                  />
                                )
                              }
                              errorText={undefined}
                            />
                          )}
                        </ToolContent>
                      </Tool>
                    );
                  }

                  return null;
                }),
              );

              return elements;
            })()}

            {!isReadonly && (
              <MessageActions
                key={`action-${message.id}`}
                chatId={chatId}
                message={message}
                vote={vote}
                isLoading={isLoading}
                setMode={setMode}
              />
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export const PreviewMessage = memo(
  PurePreviewMessage,
  (prevProps, nextProps) => {
    if (prevProps.isLoading !== nextProps.isLoading) return false;
    if (prevProps.message.id !== nextProps.message.id) return false;
    if (prevProps.requiresScrollPadding !== nextProps.requiresScrollPadding)
      return false;
    if (!equal(prevProps.message.parts, nextProps.message.parts)) return false;
    if (!equal(prevProps.vote, nextProps.vote)) return false;

    return false;
  },
);

export const ThinkingMessage = () => {
  const role = 'assistant';

  return (
    <motion.div
      data-testid="message-assistant-loading"
      className="w-full group/message"
      initial={{ y: 5, opacity: 0 }}
      animate={{ y: 0, opacity: 1, transition: { delay: 0 } }}
      data-role={role}
    >
      <div className="flex items-start gap-3 justify-start -ml-3">
        <div className="flex flex-col gap-2 w-full md:gap-4">
          <div className="p-0 text-sm text-muted-foreground">
            <LoadingText>Thinking...</LoadingText>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
