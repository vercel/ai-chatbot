'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { use } from 'react';
import { KnowledgeDocument } from '@/lib/db/schema';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Trash2, FileIcon, ExternalLinkIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
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
  params: { id: string } | Promise<{ id: string }>;
}) {
  const router = useRouter();
  const [document, setDocument] = useState<KnowledgeDocument | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const resolvedParams = use(params);

  useEffect(() => {
    fetchDocument();
  }, [resolvedParams.id]);

  async function fetchDocument() {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/knowledge/${resolvedParams.id}`);
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

  async function handleDeleteDocument() {
    try {
      setIsDeleting(true);
      const response = await fetch(`/api/knowledge/${resolvedParams.id}`, {
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
        return <FileIcon className="h-5 w-5" />;
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
          <Badge 
            variant="outline" 
            className={`${getStatusColor(document.status)} text-white mr-4`}
          >
            {document.status}
          </Badge>
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

          {document.content && (
            <div className="border rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Content</h2>
              <div className="bg-muted p-4 rounded-md overflow-auto max-h-96">
                <pre className="whitespace-pre-wrap">{document.content}</pre>
              </div>
            </div>
          )}
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
              
              {document.sourceUrl && (
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
                    {parseInt(document.fileSize, 10) > 1024 * 1024
                      ? `${(parseInt(document.fileSize, 10) / (1024 * 1024)).toFixed(2)} MB`
                      : `${(parseInt(document.fileSize, 10) / 1024).toFixed(2)} KB`}
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