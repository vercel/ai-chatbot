'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { KnowledgeDocument } from '@/lib/db/schema';
import { Button } from '@/components/ui/button';
import { KnowledgeUpload } from '@/components/knowledge-upload';
import { TrashIcon, FileIcon, ExternalLinkIcon } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

export default function KnowledgeBasePage() {
  const router = useRouter();
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDocuments();
  }, []);

  async function fetchDocuments() {
    try {
      setIsLoading(true);
      const response = await fetch('/api/knowledge');
      if (!response.ok) throw new Error('Failed to fetch documents');
      const data = await response.json();
      setDocuments(data);
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast.error('Failed to load documents');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDeleteDocument(id: string) {
    try {
      const response = await fetch(`/api/knowledge/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete document');
      }

      setDocuments(documents.filter(doc => doc.id !== id));
      toast.success('Document deleted successfully');
    } catch (error) {
      console.error('Error deleting document:', error);
      toast.error('Failed to delete document');
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
        return <FileIcon className="h-4 w-4" />;
      case 'text':
        return <FileIcon className="h-4 w-4" />;
      case 'url':
        return <ExternalLinkIcon className="h-4 w-4" />;
      case 'audio':
        return <FileIcon className="h-4 w-4" />;
      case 'video':
        return <FileIcon className="h-4 w-4" />;
      case 'youtube':
        return <ExternalLinkIcon className="h-4 w-4" />;
      default:
        return <FileIcon className="h-4 w-4" />;
    }
  };

  return (
    <div className="flex flex-col w-full h-full p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Knowledge Base</h1>
        <KnowledgeUpload onSuccess={fetchDocuments} />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : documents.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <FileIcon className="h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">No documents yet</h2>
          <p className="text-muted-foreground mb-6 max-w-md">
            Add documents to your knowledge base to help the AI provide more accurate and relevant responses.
          </p>
          <KnowledgeUpload onSuccess={fetchDocuments} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {documents.map((document) => (
            <Card key={document.id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{document.title}</CardTitle>
                  <Badge variant="outline" className={`${getStatusColor(document.status)} text-white`}>
                    {document.status}
                  </Badge>
                </div>
                <CardDescription className="line-clamp-2">
                  {document.description || 'No description provided'}
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="flex items-center text-sm text-muted-foreground">
                  <div className="flex items-center mr-4">
                    {getSourceTypeIcon(document.sourceType)}
                    <span className="ml-1 capitalize">{document.sourceType}</span>
                  </div>
                  <div>
                    {new Date(document.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </CardContent>
              <CardFooter className="pt-2 flex justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/knowledge/${document.id}`)}
                >
                  View Details
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive"
                  onClick={() => handleDeleteDocument(document.id)}
                >
                  <TrashIcon className="h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
} 