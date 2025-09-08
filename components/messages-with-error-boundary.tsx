'use client';

import React from 'react';
import { ErrorBoundary } from '@/components/error-boundary';
import { InlineErrorFallback } from '@/components/error-fallbacks';
import { Messages } from './messages';
import { PreviewMessage, ThinkingMessage } from './message';
import type { Vote } from '@/lib/db/schema';
import type { UseChatHelpers } from '@ai-sdk/react';
import type { ChatMessage } from '@/lib/types';
import { logError } from '@/lib/error-reporting';

interface MessagesWithErrorBoundaryProps {
  chatId: string;
  status: UseChatHelpers<ChatMessage>['status'];
  votes: Array<Vote> | undefined;
  messages: ChatMessage[];
  setMessages: UseChatHelpers<ChatMessage>['setMessages'];
  regenerate: UseChatHelpers<ChatMessage>['regenerate'];
  isReadonly: boolean;
  isArtifactVisible: boolean;
}

export function MessagesWithErrorBoundary(props: MessagesWithErrorBoundaryProps) {
  const handleMessagesError = React.useCallback((error: Error, errorInfo: React.ErrorInfo, errorId: string) => {
    logError(error, errorInfo, {
      component: 'Messages',
      chatId: props.chatId,
      messageCount: props.messages.length,
      status: props.status,
      isReadonly: props.isReadonly,
      errorId,
    });
  }, [props.chatId, props.messages.length, props.status, props.isReadonly]);

  return (
    <ErrorBoundary
      fallback={({ resetError, retryCount, maxRetries }) => (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">Messages failed to load</p>
            {retryCount < maxRetries && (
              <button
                onClick={resetError}
                className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
              >
                Reload Messages
              </button>
            )}
          </div>
        </div>
      )}
      onError={handleMessagesError}
      level="component"
      maxRetries={3}
      resetKeys={[props.chatId, props.messages.length]}
    >
      <Messages {...props} />
    </ErrorBoundary>
  );
}

// Enhanced message wrapper with individual error boundaries
interface MessageWithErrorBoundaryProps {
  message: ChatMessage;
  votes?: Array<Vote>;
  chatId: string;
  isReadonly: boolean;
  onMessageUpdate?: (updatedMessage: ChatMessage) => void;
}

export function MessageWithErrorBoundary({
  message,
  votes,
  chatId,
  isReadonly,
  onMessageUpdate,
}: MessageWithErrorBoundaryProps) {
  const handleMessageError = React.useCallback((error: Error, errorInfo: React.ErrorInfo, errorId: string) => {
    logError(error, errorInfo, {
      component: 'Message',
      messageId: message.id,
      messageRole: message.role,
      chatId,
      errorId,
    });
  }, [message.id, message.role, chatId]);

  return (
    <ErrorBoundary
      fallback={InlineErrorFallback}
      onError={handleMessageError}
      level="component"
      maxRetries={2}
      resetKeys={[message.id]}
    >
      <MessageContent
        message={message}
        votes={votes}
        chatId={chatId}
        isReadonly={isReadonly}
        onMessageUpdate={onMessageUpdate}
      />
    </ErrorBoundary>
  );
}

// Message content component
function MessageContent({
  message,
  votes,
  chatId,
  isReadonly,
  onMessageUpdate,
}: MessageWithErrorBoundaryProps) {
  // Handle different message types
  if (message.role === 'assistant' && message.content === '') {
    return (
      <ErrorBoundary
        fallback={InlineErrorFallback}
        level="component"
        maxRetries={1}
      >
        <ThinkingMessage />
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary
      fallback={InlineErrorFallback}
      level="component"
      maxRetries={2}
    >
      <PreviewMessage
        chatId={chatId}
        message={message}
        votes={votes?.filter(vote => vote.messageId === message.id)}
        isReadonly={isReadonly}
        onMessageUpdate={onMessageUpdate}
      />
    </ErrorBoundary>
  );
}

// Error boundary for individual message parts (attachments, artifacts, etc.)
export function MessagePartErrorBoundary({ children, partType }: { 
  children: React.ReactNode;
  partType: string;
}) {
  const handlePartError = React.useCallback((error: Error, errorInfo: React.ErrorInfo, errorId: string) => {
    logError(error, errorInfo, {
      component: 'MessagePart',
      partType,
      errorId,
    });
  }, [partType]);

  return (
    <ErrorBoundary
      fallback={({ resetError }) => (
        <div className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 border border-orange-300 rounded text-xs">
          <span className="text-orange-700">Failed to load {partType}</span>
          <button
            onClick={resetError}
            className="text-orange-600 underline hover:text-orange-800"
          >
            retry
          </button>
        </div>
      )}
      onError={handlePartError}
      level="component"
      maxRetries={1}
    >
      {children}
    </ErrorBoundary>
  );
}