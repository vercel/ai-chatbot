import { Artifact } from '@/components/create-artifact';
import { DiffView } from '@/components/diffview';
import { DocumentSkeleton } from '@/components/document-skeleton';
import {
  ClockRewind,
  CopyIcon,
  RedoIcon,
  UndoIcon,
  DownloadIcon,
  EyeIcon,
  CodeIcon,
} from '@/components/icons';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';

interface DashboardArtifactMetadata {
  chatId?: string;
  messagesCount?: number;
}

export const dashboardArtifact = new Artifact<'dashboard', DashboardArtifactMetadata>({
  kind: 'dashboard',
  description: 'Create interactive HTML dashboards from chat conversations and data.',
  initialize: async ({ documentId, setMetadata }) => {
    setMetadata({
      chatId: undefined,
      messagesCount: 0,
    });
  },
  onStreamPart: ({ streamPart, setMetadata, setArtifact }) => {
    if (streamPart.type === 'dashboard-metadata') {
      const parsedContent = JSON.parse(streamPart.content as string) as DashboardArtifactMetadata;
      setMetadata((metadata) => ({
        ...metadata,
        ...parsedContent,
      }));
    }

    if (streamPart.type === 'text-delta') {
      setArtifact((draftArtifact) => {
        return {
          ...draftArtifact,
          content: draftArtifact.content + (streamPart.content as string),
          isVisible:
            draftArtifact.status === 'streaming' &&
            draftArtifact.content.length > 500 &&
            draftArtifact.content.length < 600
              ? true
              : draftArtifact.isVisible,
          status: 'streaming',
        };
      });
    }
  },
  content: ({
    mode,
    status,
    content,
    currentVersionIndex,
    getDocumentContentById,
    isLoading,
    metadata,
  }) => {
    // Show HTML tab during generation, switch to preview when complete
    const isGenerating = status === 'streaming';
    const [userViewMode, setUserViewMode] = useState<'preview' | 'code' | null>(null);
    const [justFinishedGenerating, setJustFinishedGenerating] = useState(false);
    
    // Track when generation completes to show a brief notification
    useEffect(() => {
      if (!isGenerating && status !== 'idle' && userViewMode === null) {
        setJustFinishedGenerating(true);
        const timer = setTimeout(() => setJustFinishedGenerating(false), 3000);
        return () => clearTimeout(timer);
      }
    }, [isGenerating, status, userViewMode]);
    
    // Determine actual view mode based on generation status and user preference
    const viewMode = (() => {
      if (isGenerating) return 'code'; // Always show HTML during generation
      if (userViewMode !== null) return userViewMode; // User has made a choice
      return 'preview'; // Default to preview when generation is complete
    })();

    if (isLoading) {
      return <DocumentSkeleton artifactKind="dashboard" />;
    }

    if (mode === 'diff') {
      const oldContent = getDocumentContentById(currentVersionIndex - 1);
      const newContent = getDocumentContentById(currentVersionIndex);

      return <DiffView oldContent={oldContent} newContent={newContent} />;
    }

    // Debug: Log the content value
    console.log('Dashboard content debug:', {
      contentLength: content?.length,
      contentStart: content?.substring(0, 100),
      status,
      isGenerating,
      viewMode
    });

    // Ensure we have valid HTML content
    const hasValidHtml = content && (
      content.includes('<!DOCTYPE html>') || 
      content.includes('<html') || 
      content.includes('<body')
    );

    return (
      <div className="flex flex-col h-full w-full">
        <div className="flex items-center justify-between mb-3 pb-2 border-b">
          <div className="flex items-center gap-2">
            <div className="text-sm text-muted-foreground">
              {metadata ? (
                <>
                  Dashboard: {metadata.messagesCount} messages
                  {metadata.chatId && ` | Chat: ${metadata.chatId.slice(0, 8)}...`}
                </>
              ) : (
                'Interactive Dashboard'
              )}
            </div>
            {justFinishedGenerating && (
              <div className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full animate-pulse">
                ✨ Generation complete - now showing preview
              </div>
            )}
            {isGenerating && (
              <div className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                🔄 Generating HTML...
              </div>
            )}
          </div>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => setUserViewMode('preview')}
              disabled={isGenerating}
              className={`px-3 py-1 text-xs rounded-md flex items-center gap-1 font-medium transition-colors ${
                viewMode === 'preview' 
                  ? 'bg-blue-500 text-white' 
                  : isGenerating 
                    ? 'bg-gray-50 text-gray-400 cursor-not-allowed' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <EyeIcon size={14} />
              Preview
            </button>
            <button
              type="button"
              onClick={() => setUserViewMode('code')}
              className={`px-3 py-1 text-xs rounded-md flex items-center gap-1 font-medium transition-colors ${
                viewMode === 'code' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <CodeIcon size={14} />
              HTML {isGenerating && <span className="text-xs opacity-75">(generating...)</span>}
            </button>
          </div>
        </div>
        
        <div className="flex-1 relative">
          {viewMode === 'preview' ? (
            <div className="w-full h-full bg-white rounded-lg border shadow-sm overflow-hidden">
              {hasValidHtml ? (
                <iframe
                  srcDoc={content}
                  className="w-full h-full border-0"
                  sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-downloads"
                  title="Dashboard Preview"
                  style={{ 
                    minHeight: '600px',
                    width: '100%',
                    height: '100%'
                  }}
                  loading="lazy"
                />
              ) : (
                <div className="flex items-center justify-center h-full bg-gray-50">
                  <div className="text-center text-gray-500">
                    <div className="text-lg mb-2">⚠️ Invalid HTML Content</div>
                    <div className="text-sm">Switch to HTML view to see the raw content</div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="w-full h-full border rounded-lg overflow-hidden bg-gray-50">
              <div className="h-full overflow-auto">
                <div className="text-xs p-2 bg-blue-50 border-b text-blue-700">
                  Debug: Content length: {content?.length || 0} | View mode: {viewMode} | Is generating: {isGenerating.toString()}
                </div>
                <pre className="text-sm p-4 text-gray-800 whitespace-pre-wrap break-words font-mono leading-relaxed">
                  {content || getDocumentContentById(currentVersionIndex) || (isGenerating ? 'Generating HTML...' : 'No content available')}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  },
  actions: [
    {
      icon: <ClockRewind size={18} />,
      description: 'View changes',
      onClick: ({ handleVersionChange }) => {
        handleVersionChange('toggle');
      },
      isDisabled: ({ currentVersionIndex }) => {
        if (currentVersionIndex === 0) {
          return true;
        }
        return false;
      },
    },
    {
      icon: <UndoIcon size={18} />,
      description: 'View Previous version',
      onClick: ({ handleVersionChange }) => {
        handleVersionChange('prev');
      },
      isDisabled: ({ currentVersionIndex }) => {
        if (currentVersionIndex === 0) {
          return true;
        }
        return false;
      },
    },
    {
      icon: <RedoIcon size={18} />,
      description: 'View Next version',
      onClick: ({ handleVersionChange }) => {
        handleVersionChange('next');
      },
      isDisabled: ({ isCurrentVersion }) => {
        if (isCurrentVersion) {
          return true;
        }
        return false;
      },
    },
    {
      icon: <CopyIcon size={18} />,
      description: 'Copy HTML to clipboard',
      onClick: ({ content }) => {
        navigator.clipboard.writeText(content);
        toast.success('Dashboard HTML copied to clipboard!');
      },
    },
    {
      icon: <DownloadIcon size={18} />,
      description: 'Download HTML file',
      onClick: ({ content }) => {
        const blob = new Blob([content], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'dashboard.html';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success('Dashboard downloaded!');
      },
    },
  ],
  toolbar: [
    {
      icon: <div className="text-xs font-semibold">📊</div>,
      description: 'Add more visualizations',
      onClick: ({ appendMessage }) => {
        appendMessage({
          role: 'user',
          content:
            'Please enhance this dashboard with more interactive charts, graphs, and data visualizations to better represent the conversation data.',
        });
      },
    },
    {
      icon: <div className="text-xs font-semibold">🎨</div>,
      description: 'Improve styling',
      onClick: ({ appendMessage }) => {
        appendMessage({
          role: 'user',
          content:
            'Please improve the dashboard styling with better colors, layout, and modern CSS design patterns.',
        });
      },
    },
    {
      icon: <div className="text-xs font-semibold">🔧</div>,
      description: 'Fix rendering issues',
      onClick: ({ appendMessage }) => {
        appendMessage({
          role: 'user',
          content:
            'Please ensure this dashboard HTML is complete and self-contained with proper DOCTYPE, embedded CSS, and JavaScript that will render correctly in an iframe.',
        });
      },
    },
  ],
});