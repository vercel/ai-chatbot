'use client';

import React from 'react';
import { ErrorBoundary } from '@/components/error-boundary';
import { ChatErrorFallback } from '@/components/error-fallbacks';
import { Chat } from './chat';
import type { Session } from 'next-auth';
import type { VisibilityType } from './visibility-selector';
import type { ChatMessage } from '@/lib/types';
import { initializeErrorReporting, logError } from '@/lib/error-reporting';

// Initialize error reporting for chat components
if (typeof window !== 'undefined') {
  initializeErrorReporting({
    enabled: true,
    enableConsoleLogging: process.env.NODE_ENV === 'development',
    enableRemoteReporting: process.env.NODE_ENV === 'production',
  });
}

interface ChatWithErrorBoundaryProps {
  id: string;
  initialMessages: ChatMessage[];
  initialChatModel: string;
  initialVisibilityType: VisibilityType;
  isReadonly: boolean;
  session: Session;
  autoResume: boolean;
}

export function ChatWithErrorBoundary(props: ChatWithErrorBoundaryProps) {
  const handleChatError = React.useCallback((error: Error, errorInfo: React.ErrorInfo, errorId: string) => {
    // Log chat-specific errors with context
    logError(error, errorInfo, {
      component: 'Chat',
      chatId: props.id,
      messageCount: props.initialMessages.length,
      chatModel: props.initialChatModel,
      isReadonly: props.isReadonly,
      errorId,
    });
  }, [props.id, props.initialMessages.length, props.initialChatModel, props.isReadonly]);

  return (
    <ErrorBoundary
      fallback={ChatErrorFallback}
      onError={handleChatError}
      level="component"
      maxRetries={3}
      resetKeys={[props.id, props.initialChatModel]}
      resetOnPropsChange={true}
    >
      <Chat {...props} />
    </ErrorBoundary>
  );
}

// Additional error boundary for individual messages
export function MessageErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary
      level="component"
      maxRetries={2}
      fallback={({ resetError, retryCount, maxRetries }) => (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm">
          <div className="flex items-center gap-2">
            <span className="text-red-600">Message failed to load</span>
            {retryCount < maxRetries && (
              <button
                onClick={resetError}
                className="text-red-600 underline hover:text-red-800"
              >
                retry
              </button>
            )}
          </div>
        </div>
      )}
    >
      {children}
    </ErrorBoundary>
  );
}

// Error boundary for multimodal input
export function InputErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary
      level="component"
      maxRetries={3}
      fallback={({ resetError, retryCount, maxRetries }) => (
        <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
          <div className="text-center">
            <p className="text-orange-800 font-medium mb-2">Input Error</p>
            <p className="text-orange-600 text-sm mb-3">
              The message input encountered an error
            </p>
            {retryCount < maxRetries ? (
              <button
                onClick={resetError}
                className="px-3 py-1 bg-orange-600 text-white rounded hover:bg-orange-700"
              >
                Restore Input
              </button>
            ) : (
              <p className="text-orange-600 text-xs">
                Please refresh the page if the problem persists
              </p>
            )}
          </div>
        </div>
      )}
    >
      {children}
    </ErrorBoundary>
  );
}