'use client';

import type { UIMessage } from 'ai';
import { TextPart, ReasoningPart, ToolInvocationPart } from './parts';
import type { MessageMode, BaseMessageProps } from './types';

interface MessagePartsProps extends MessageMode {
  message: UIMessage;
  isLoading: boolean;
  isReadonly: boolean;
  setMessages: BaseMessageProps['setMessages'];
  reload: BaseMessageProps['reload'];
}

export function MessageParts({
  message,
  mode,
  setMode,
  isLoading,
  isReadonly,
  setMessages,
  reload,
}: MessagePartsProps) {
  if (!message.parts) return null;

  return (
    <>
      {message.parts.map((part, index) => {
        const { type } = part;
        const key = `message-${message.id}-part-${index}`;

        if (type === 'reasoning') {
          return (
            <ReasoningPart
              key={key}
              partKey={key}
              isLoading={isLoading}
              reasoning={part.reasoning}
            />
          );
        }

        if (type === 'text') {
          return (
            <TextPart
              key={key}
              partKey={key}
              message={message}
              text={part.text}
              mode={mode}
              setMode={setMode}
              isReadonly={isReadonly}
              setMessages={setMessages}
              reload={reload}
            />
          );
        }

        if (type === 'tool-invocation') {
          return (
            <ToolInvocationPart
              key={part.toolInvocation.toolCallId}
              toolInvocation={part.toolInvocation}
              isReadonly={isReadonly}
            />
          );
        }

        return null;
      })}
    </>
  );
}