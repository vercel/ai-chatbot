'use client';
import { motion } from 'framer-motion';
import { memo, useState } from 'react';
import type { Vote } from '@/lib/db/schema';
import { DocumentToolResult } from './document';
import { SparklesIcon } from './icons';
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
import { DocumentPreview } from './document-preview';
import { MessageReasoning } from './message-reasoning';
import type { UseChatHelpers } from '@ai-sdk/react';
import type { ChatMessage } from '@/lib/types';
import { useDataStream } from './data-stream-provider';

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
    <motion.div
      data-testid={`message-${message.role}`}
      className="w-full group/message"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      data-role={message.role}
    >
      <div
        className={cn('flex items-start gap-3 w-full', {
          'justify-end': message.role === 'user' && mode !== 'edit',
          'justify-start': message.role === 'assistant',
        })}
      >
        {message.role === 'assistant' && (
          <div className="flex justify-center items-center -mt-1 rounded-full ring-1 size-8 shrink-0 ring-border bg-background">
            <SparklesIcon size={14} />
          </div>
        )}

        <div
          className={cn('flex flex-col', {
            'gap-2 md:gap-4': message.parts?.some(
              (p) => p.type === 'text' && p.text?.trim(),
            ),
            'min-h-96': message.role === 'assistant' && requiresScrollPadding,
            'w-full':
              (message.role === 'assistant' &&
                message.parts?.some(
                  (p) => p.type === 'text' && p.text?.trim(),
                )) ||
              mode === 'edit',
            'max-w-[90%] sm:max-w-[min(fit-content,80%)]':
              message.role === 'user' && mode !== 'edit',
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

          {message.parts?.map((part, index) => {
            const { type } = part;
            const key = `message-${message.id}-part-${index}`;

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
                  <div key={key}>
                    <MessageContent
                      data-testid="message-content"
                      className={cn({
                        'rounded-2xl px-3 py-2 break-words text-white text-right w-fit':
                          message.role === 'user',
                        'bg-transparent px-0 py-0 text-left':
                          message.role === 'assistant',
                      })}
                      style={
                        message.role === 'user'
                          ? { backgroundColor: '#006cff' }
                          : undefined
                      }
                    >
                      <Response>{sanitizeText(part.text)}</Response>
                    </MessageContent>
                  </div>
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
                        output={<Weather weatherAtLocation={part.output} />}
                        errorText={undefined}
                      />
                    )}
                  </ToolContent>
                </Tool>
              );
            }

            if (type === 'tool-createDocument') {
              const { toolCallId } = part;

              if (part.output && 'error' in part.output) {
                return (
                  <div
                    key={toolCallId}
                    className="p-4 text-red-500 bg-red-50 rounded-lg border border-red-200 dark:bg-red-950/50"
                  >
                    Error creating document: {String(part.output.error)}
                  </div>
                );
              }

              return (
                <DocumentPreview
                  key={toolCallId}
                  isReadonly={isReadonly}
                  result={part.output}
                />
              );
            }

            if (type === 'tool-updateDocument') {
              const { toolCallId } = part;

              if (part.output && 'error' in part.output) {
                return (
                  <div
                    key={toolCallId}
                    className="p-4 text-red-500 bg-red-50 rounded-lg border border-red-200 dark:bg-red-950/50"
                  >
                    Error updating document: {String(part.output.error)}
                  </div>
                );
              }

              return (
                <div key={toolCallId} className="relative">
                  <DocumentPreview
                    isReadonly={isReadonly}
                    result={part.output}
                    args={{ ...part.output, isUpdate: true }}
                  />
                </div>
              );
            }

            if (type === 'tool-requestSuggestions') {
              const { toolCallId, state } = part;

              return (
                <Tool key={toolCallId} defaultOpen={true}>
                  <ToolHeader type="tool-requestSuggestions" state={state} />
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
          })}

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
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      data-role={role}
    >
      <div className="flex gap-3 justify-start items-start">
        <div className="flex justify-center items-center -mt-1 rounded-full ring-1 size-8 shrink-0 ring-border bg-background">
          <SparklesIcon size={14} />
        </div>

        <div className="flex flex-col gap-2 w-full md:gap-4">
          <div className="px-0 py-0 text-sm text-muted-foreground">
            <LoadingText>Thinking...</LoadingText>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const LoadingText = ({ children }: { children: React.ReactNode }) => {
  return (
    <motion.div
      animate={{ backgroundPosition: ['100% 50%', '-100% 50%'] }}
      transition={{
        duration: 1.5,
        repeat: Number.POSITIVE_INFINITY,
        ease: 'linear',
      }}
      style={{
        background:
          'linear-gradient(90deg, hsl(var(--muted-foreground)) 0%, hsl(var(--muted-foreground)) 35%, hsl(var(--foreground)) 50%, hsl(var(--muted-foreground)) 65%, hsl(var(--muted-foreground)) 100%)',
        backgroundSize: '200% 100%',
        WebkitBackgroundClip: 'text',
        backgroundClip: 'text',
      }}
      className="flex items-center text-transparent"
    >
      {children}
    </motion.div>
  );
};
