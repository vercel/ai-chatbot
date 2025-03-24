'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { use } from 'react';
import { KnowledgeDocument, KnowledgeChunk } from '@/lib/db/schema';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Trash2, FileIcon, ExternalLinkIcon, FileAudio, Volume2 } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { TranscriptViewer } from '@/components/transcript-viewer';
import { WhisperTranscriptionResponse } from '@/lib/knowledge/types/audio';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export default function KnowledgeDocumentPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const [document, setDocument] = useState<(KnowledgeDocument & { chunks?: KnowledgeChunk[] }) | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<'combined' | 'chunks'>('combined');
  const [transcript, setTranscript] = useState<WhisperTranscriptionResponse | null>(null);
  const { id } = use(params);

  // Process chunks for display
  const processedChunks = useMemo(() => {
    if (!document?.chunks) return [];
    
    // Sort chunks by chunkIndex if available
    return [...document.chunks].sort((a, b) => {
      const aIndex = parseInt(a.chunkIndex || '0');
      const bIndex = parseInt(b.chunkIndex || '0');
      return aIndex - bIndex;
    });
  }, [document?.chunks]);

  // Combined content from all chunks for display
  const combinedContent = useMemo(() => {
    if (processedChunks.length === 0) return '';
    return processedChunks.map(chunk => chunk.content).join('\n\n');
  }, [processedChunks]);

  // Formatted message for no content case
  const noContentMessage = useMemo(() => {
    if (!document) return 'No extracted content available.';
    
    if (document.status === 'processing') {
      return 'Document is still being processed. Please check back later.';
    } else if (document.status === 'failed') {
      return `Processing failed: ${document.processingError || 'Unknown error'}`;
    } else if (processedChunks.length === 0) {
      return 'No extracted content available.';
    }
    
    return 'No extracted content available.';
  }, [document, processedChunks]);

  // Audio URL for voice notes
  const audioUrl = useMemo(() => {
    if (document?.sourceType === 'audio') {
      return `/api/knowledge/${id}/audio`;
    }
    return null;
  }, [document, id]);

  useEffect(() => {
    fetchDocument();
    if (id) {
      fetchTranscript(id);
    }
  }, [id]);
  
  // Function to refresh document data
  const refreshDocument = async () => {
    try {
      setIsRefreshing(true);
      await fetchDocument();
      if (document?.sourceType === 'audio') {
        await fetchTranscript(id);
      }
      toast.success('Document refreshed');
    } catch (error) {
      console.error('Error refreshing document:', error);
      toast.error('Failed to refresh document');
    } finally {
      setIsRefreshing(false);
    }
  };

  async function fetchDocument() {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/knowledge/${id}`);
      if (!response.ok) {
        if (response.status === 404) {
          toast.error('Document not found');
          router.push('/knowledge');
          return;
        }
        throw new Error('Failed to fetch document');
      }
      const data = await response.json();
      setDocument(data);
    } catch (error) {
      console.error('Error fetching document:', error);
      toast.error('Failed to load document');
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchTranscript(documentId: string) {
    try {
      const response = await fetch(`/api/knowledge/${documentId}/transcription/progress`);
      if (!response.ok) {
        return;
      }
      
      const data = await response.json();
      if (data.status === 'completed' && data.transcript) {
        setTranscript(data.transcript);
      }
    } catch (error) {
      console.error('Error fetching transcript:', error);
    }
  }

  async function handleDeleteDocument() {
    try {
      setIsDeleting(true);
      const response = await fetch(`/api/knowledge/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete document');
      }

      toast.success('Document deleted successfully');
      router.push('/knowledge');
    } catch (error) {
      console.error('Error deleting document:', error);
      toast.error('Failed to delete document');
      setIsDeleting(false);
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'processing':
        return 'bg-yellow-500';
      case 'completed':
        return 'bg-green-500';
      case 'failed':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getSourceTypeIcon = (type: string) => {
    switch (type) {
      case 'pdf':
        return <FileIcon className="h-5 w-5" />;
      case 'text':
        return <FileIcon className="h-5 w-5" />;
      case 'url':
        return <ExternalLinkIcon className="h-5 w-5" />;
      case 'audio':
        return <FileAudio className="h-5 w-5" />;
      case 'video':
        return <FileIcon className="h-5 w-5" />;
      case 'youtube':
        return <ExternalLinkIcon className="h-5 w-5" />;
      default:
        return <FileIcon className="h-5 w-5" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <h2 className="text-xl font-semibold mb-4">Document not found</h2>
        <Button onClick={() => router.push('/knowledge')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Knowledge Base
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full h-full p-6">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            onClick={() => router.push('/knowledge')}
            className="mr-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">{document.title}</h1>
        </div>
        <div className="flex items-center">
          <div className="flex items-center">
            <Badge 
              variant="outline" 
              className={`${getStatusColor(document.status)} text-white mr-2`}
            >
              {document.status}
            </Badge>
            {document.status === 'processing' && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            )}
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={isDeleting}>
                <Trash2 className="h-4 w-4 mr-2" />
                {isDeleting ? 'Deleting...' : 'Delete'}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the document
                  and remove it from the knowledge base.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteDocument}>
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          <div className="border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Description</h2>
            <p className="text-muted-foreground">
              {document.description || 'No description provided'}
            </p>
          </div>

          {/* Audio Player for Voice Notes */}
          {document.sourceType === 'audio' && audioUrl && (
            <div className="border rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Audio Recording</h2>
              <div className="bg-muted p-4 rounded-md">
                <audio 
                  controls 
                  className="w-full" 
                  src={audioUrl}
                >
                  Your browser does not support the audio element.
                </audio>
              </div>
            </div>
          )}

          {/* Transcript Viewer for Voice Notes */}
          {document.sourceType === 'audio' && transcript && (
            <div className="border rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Transcript</h2>
              <TranscriptViewer transcript={transcript} audioUrl={audioUrl || undefined} />
            </div>
          )}

          {/* Text Content (for text documents) */}
          {document.sourceType === 'text' && processedChunks.length > 0 && (
            <div className="border rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Content</h2>
              <div className="bg-muted p-4 rounded-md overflow-auto max-h-96">
                <pre className="whitespace-pre-wrap">{processedChunks[0]?.content || 'No content available'}</pre>
              </div>
            </div>
          )}

          {/* Extracted Content Section */}
          <div className="border rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Extracted Content</h2>
              <div className="flex space-x-2">
                {processedChunks.length > 0 && (
                  <>
                    <Button 
                      variant={viewMode === 'combined' ? 'default' : 'outline'} 
                      size="sm"
                      onClick={() => setViewMode('combined')}
                    >
                      Combined View
                    </Button>
                    <Button 
                      variant={viewMode === 'chunks' ? 'default' : 'outline'} 
                      size="sm"
                      onClick={() => setViewMode('chunks')}
                    >
                      Chunks View
                    </Button>
                  </>
                )}
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={refreshDocument}
                  disabled={isRefreshing}
                  className={isRefreshing ? 'opacity-50 cursor-not-allowed' : ''}
                >
                  {isRefreshing ? (
                    <>
                      <div className="animate-spin h-4 w-4 mr-2 border-b-2 border-current rounded-full"></div>
                      Refreshing...
                    </>
                  ) : (
                    'Refresh'
                  )}
                </Button>
              </div>
            </div>
            <div className="bg-muted p-4 rounded-md overflow-auto max-h-[500px] scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100">
              {processedChunks.length > 0 ? (
                viewMode === 'combined' ? (
                  <pre className="whitespace-pre-wrap text-sm">{combinedContent}</pre>
                ) : (
                  processedChunks.map((chunk, index) => (
                    <div key={chunk.id} className="mb-4 pb-4 border-b border-gray-200 last:border-0">
                      <div className="text-xs text-muted-foreground mb-1">Chunk {index + 1}</div>
                      <pre className="whitespace-pre-wrap text-sm">{chunk.content}</pre>
                    </div>
                  ))
                )
              ) : (
                <div className={`p-4 rounded-md ${document?.status === 'failed' ? 'bg-red-50 border border-red-200' : 'bg-amber-50 border border-amber-200'}`}>
                  <p className={document?.status === 'failed' ? 'text-red-800' : 'text-amber-800'}>{noContentMessage}</p>
                  {document?.status === 'processing' && (
                    <div className="mt-2 flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-amber-800 mr-2"></div>
                      <p className="text-amber-800 text-sm">Processing in progress...</p>
                    </div>
                  )}
                  {document?.status === 'failed' && document.processingError && (
                    <div className="mt-2">
                      <p className="text-red-800 text-sm font-semibold">Error details:</p>
                      <p className="text-red-800 text-sm mt-1">{document.processingError}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Details</h2>
            <dl className="space-y-4">
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Source Type</dt>
                <dd className="flex items-center mt-1">
                  {getSourceTypeIcon(document.sourceType)}
                  <span className="ml-2 capitalize">{document.sourceType}</span>
                </dd>
              </div>
              
              {document.sourceUrl && document.sourceType === 'url' && (
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Source URL</dt>
                  <dd className="mt-1">
                    <a 
                      href={document.sourceUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:underline break-all flex items-center"
                    >
                      <span className="mr-1">{document.sourceUrl}</span>
                      <ExternalLinkIcon className="h-3 w-3" />
                    </a>
                  </dd>
                </div>
              )}
              
              {document.sourceUrl && document.sourceType !== 'url' && (
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Source URL</dt>
                  <dd className="mt-1">
                    <a 
                      href={document.sourceUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:underline break-all"
                    >
                      {document.sourceUrl}
                    </a>
                  </dd>
                </div>
              )}
              
              {document.fileSize && (
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">File Size</dt>
                  <dd className="mt-1">
                    {document.fileSize}
                  </dd>
                </div>
              )}
              
              {document.fileType && (
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">File Type</dt>
                  <dd className="mt-1">
                    {document.fileType}
                  </dd>
                </div>
              )}
              
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Created</dt>
                <dd className="mt-1">
                  {new Date(document.createdAt).toLocaleString()}
                </dd>
              </div>
              
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Last Updated</dt>
                <dd className="mt-1">
                  {new Date(document.updatedAt).toLocaleString()}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}