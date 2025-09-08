'use client';

import React from 'react';
import { ErrorBoundary } from '@/components/error-boundary';
import { ArtifactErrorFallback, LoadingErrorFallback } from '@/components/error-fallbacks';
import { Artifact } from './artifact';
import { logError, ErrorRecovery } from '@/lib/error-reporting';
import type { UseChatHelpers } from '@ai-sdk/react';
import type { VisibilityType } from './visibility-selector';
import type { Attachment, ChatMessage } from '@/lib/types';
import type { Vote } from '@/lib/db/schema';
import type { Dispatch, SetStateAction } from 'react';

interface ArtifactWithErrorBoundaryProps {
  chatId: string;
  input: string;
  setInput: Dispatch<SetStateAction<string>>;
  status: UseChatHelpers<ChatMessage>['status'];
  stop: UseChatHelpers<ChatMessage>['stop'];
  attachments: Attachment[];
  setAttachments: Dispatch<SetStateAction<Attachment[]>>;
  sendMessage: UseChatHelpers<ChatMessage>['sendMessage'];
  messages: ChatMessage[];
  setMessages: UseChatHelpers<ChatMessage>['setMessages'];
  regenerate: UseChatHelpers<ChatMessage>['regenerate'];
  votes: Array<Vote> | undefined;
  isReadonly: boolean;
  selectedVisibilityType: VisibilityType;
  selectedModelId: string;
}

export function ArtifactWithErrorBoundary(props: ArtifactWithErrorBoundaryProps) {
  const handleArtifactError = React.useCallback((error: Error, errorInfo: React.ErrorInfo, errorId: string) => {
    logError(error, errorInfo, {
      component: 'Artifact',
      chatId: props.chatId,
      messageCount: props.messages.length,
      selectedModelId: props.selectedModelId,
      artifactStatus: props.status,
      errorId,
    });
  }, [props.chatId, props.messages.length, props.selectedModelId, props.status]);

  return (
    <ErrorBoundary
      fallback={ArtifactErrorFallback}
      onError={handleArtifactError}
      level="component"
      maxRetries={2}
      resetKeys={[props.chatId, props.selectedModelId]}
    >
      <Artifact {...props} />
    </ErrorBoundary>
  );
}

// Error boundary for artifact content rendering
export function ArtifactContentErrorBoundary({ 
  children, 
  artifactType,
  documentId 
}: { 
  children: React.ReactNode;
  artifactType: string;
  documentId?: string;
}) {
  const handleContentError = React.useCallback((error: Error, errorInfo: React.ErrorInfo, errorId: string) => {
    logError(error, errorInfo, {
      component: 'ArtifactContent',
      artifactType,
      documentId,
      errorId,
    });
  }, [artifactType, documentId]);

  return (
    <ErrorBoundary
      fallback={({ resetError, retryCount, maxRetries }) => (
        <div className="flex flex-col items-center justify-center p-8 bg-muted/30 border border-border rounded-lg min-h-[200px]">
          <div className="text-center">
            <p className="text-lg font-medium text-foreground mb-2">Content Error</p>
            <p className="text-muted-foreground mb-4">
              Failed to render {artifactType} content
            </p>
            {retryCount < maxRetries && (
              <button
                onClick={resetError}
                className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
              >
                Retry Rendering
              </button>
            )}
          </div>
        </div>
      )}
      onError={handleContentError}
      level="component"
      maxRetries={3}
      resetKeys={[artifactType, documentId]}
    >
      {children}
    </ErrorBoundary>
  );
}

// Enhanced artifact actions with error handling
export function ArtifactActionsErrorBoundary({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  return (
    <ErrorBoundary
      fallback={({ resetError }) => (
        <div className="flex items-center gap-2 p-2 bg-orange-50 border border-orange-200 rounded">
          <span className="text-orange-700 text-sm">Actions unavailable</span>
          <button
            onClick={resetError}
            className="text-orange-600 text-xs underline hover:text-orange-800"
          >
            retry
          </button>
        </div>
      )}
      level="component"
      maxRetries={2}
    >
      {children}
    </ErrorBoundary>
  );
}

// Document loading error boundary
export function DocumentLoadingErrorBoundary({ 
  children,
  documentId 
}: { 
  children: React.ReactNode;
  documentId?: string;
}) {
  const handleDocumentError = React.useCallback(async (error: Error, errorInfo: React.ErrorInfo, errorId: string) => {
    // Enhanced error handling for document loading
    await logError(error, errorInfo, {
      component: 'DocumentLoading',
      documentId,
      errorType: 'document_fetch_failure',
      errorId,
    });

    // Try to recover by clearing cache
    if (documentId && error.message.includes('fetch')) {
      try {
        // Clear SWR cache for this document
        const { mutate } = await import('swr');
        await mutate(`/api/document?id=${documentId}`, undefined, { revalidate: false });
      } catch (cacheError) {
        console.warn('Failed to clear document cache:', cacheError);
      }
    }
  }, [documentId]);

  return (
    <ErrorBoundary
      fallback={LoadingErrorFallback}
      onError={handleDocumentError}
      level="component"
      maxRetries={3}
      resetKeys={[documentId]}
    >
      {children}
    </ErrorBoundary>
  );
}

// Artifact editor error boundary with autosave recovery
export function ArtifactEditorErrorBoundary({ 
  children,
  documentId,
  content 
}: { 
  children: React.ReactNode;
  documentId?: string;
  content?: string;
}) {
  const [lastGoodContent, setLastGoodContent] = React.useState<string>('');

  // Track last known good content
  React.useEffect(() => {
    if (content && content !== lastGoodContent) {
      setLastGoodContent(content);
    }
  }, [content, lastGoodContent]);

  const handleEditorError = React.useCallback(async (error: Error, errorInfo: React.ErrorInfo, errorId: string) => {
    await logError(error, errorInfo, {
      component: 'ArtifactEditor',
      documentId,
      hasContent: !!content,
      contentLength: content?.length || 0,
      errorId,
    });

    // Try to save current content before crash
    if (documentId && content && content !== lastGoodContent) {
      try {
        await ErrorRecovery.withRetry(async () => {
          await fetch(`/api/document/${documentId}/autosave`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content }),
          });
        }, 2, 1000);
      } catch (saveError) {
        console.warn('Failed to autosave content:', saveError);
      }
    }
  }, [documentId, content, lastGoodContent]);

  return (
    <ErrorBoundary
      fallback={({ resetError, retryCount, maxRetries }) => (
        <div className="p-6 bg-orange-50 border border-orange-200 rounded-lg">
          <div className="text-center">
            <h3 className="text-lg font-medium text-orange-800 mb-2">Editor Error</h3>
            <p className="text-orange-600 mb-4">
              The editor encountered an error. Your work may have been automatically saved.
            </p>
            <div className="flex justify-center gap-3">
              {retryCount < maxRetries && (
                <button
                  onClick={resetError}
                  className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700"
                >
                  Restore Editor
                </button>
              )}
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Reload Page
              </button>
            </div>
            {lastGoodContent && (
              <details className="mt-4 text-left">
                <summary className="cursor-pointer text-sm text-orange-600">
                  Show last saved content
                </summary>
                <div className="mt-2 p-2 bg-white border rounded text-xs font-mono max-h-32 overflow-auto">
                  {lastGoodContent.substring(0, 500)}
                  {lastGoodContent.length > 500 && '...'}
                </div>
              </details>
            )}
          </div>
        </div>
      )}
      onError={handleEditorError}
      level="component"
      maxRetries={2}
      resetKeys={[documentId]}
    >
      {children}
    </ErrorBoundary>
  );
}

// Preview error boundary for artifact previews
export function ArtifactPreviewErrorBoundary({ 
  children,
  artifactType 
}: { 
  children: React.ReactNode;
  artifactType: string;
}) {
  return (
    <ErrorBoundary
      fallback={({ resetError }) => (
        <div className="flex items-center justify-center p-6 bg-red-50 border border-red-200 rounded">
          <div className="text-center">
            <p className="text-red-800 font-medium">Preview Error</p>
            <p className="text-red-600 text-sm mb-3">
              Unable to preview {artifactType}
            </p>
            <button
              onClick={resetError}
              className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
            >
              Retry Preview
            </button>
          </div>
        </div>
      )}
      level="component"
      maxRetries={2}
    >
      {children}
    </ErrorBoundary>
  );
}