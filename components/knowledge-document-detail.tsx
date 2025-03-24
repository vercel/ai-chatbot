'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { KnowledgeDocument, KnowledgeChunk } from '@/lib/db/schema';
import { Button } from '@/components/ui/button';
import { ArrowUpIcon, TrashIcon } from '@/components/icons';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

interface KnowledgeDocumentDetailProps {
  document: KnowledgeDocument;
  chunks: KnowledgeChunk[];
}

export function KnowledgeDocumentDetail({
  document,
  chunks,
}: KnowledgeDocumentDetailProps) {
  const router = useRouter();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [title, setTitle] = useState(document.title);
  const [description, setDescription] = useState(document.description || '');

  const handleUpdateDocument = async () => {
    try {
      setIsUpdating(true);

      const response = await fetch(`/api/knowledge/${document.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          description,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update document');
      }

      setIsEditDialogOpen(false);
      toast.success('Document updated successfully');
      router.refresh();
    } catch (error) {
      console.error('Error updating document:', error);
      toast.error('Failed to update document');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteDocument = async () => {
    try {
      const response = await fetch(`/api/knowledge/${document.id}`, {
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
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'processing':
        return 'text-yellow-500';
      case 'completed':
        return 'text-green-500';
      case 'failed':
        return 'text-red-500';
      default:
        return '';
    }
  };

  return (
    <div className="container py-6">
      <div className="flex items-center mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push('/knowledge')}
          className="mr-2"
        >
          <ArrowUpIcon className="mr-2" />
          Back to Knowledge Base
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle>{document.title}</CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditDialogOpen(true)}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="size-4"
                    >
                      <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                      <path d="m15 5 4 4" />
                    </svg>
                    <span className="sr-only">Edit</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsDeleteDialogOpen(true)}
                  >
                    <div className="mr-2">
                      <TrashIcon size={16} />
                    </div>
                    <span className="sr-only">Delete</span>
                  </Button>
                </div>
              </div>
              <CardDescription>
                {document.description || 'No description'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Type:</span>
                  <span className="capitalize">{document.sourceType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <span className={getStatusColor(document.status)}>
                    {document.status.charAt(0).toUpperCase() + document.status.slice(1)}
                  </span>
                </div>
                {document.processingError && (
                  <div className="flex flex-col gap-1">
                    <span className="text-muted-foreground">Error:</span>
                    <span className="text-red-500 text-sm">
                      {document.processingError}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Created:</span>
                  <span>{new Date(document.createdAt).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Updated:</span>
                  <span>{new Date(document.updatedAt).toLocaleString()}</span>
                </div>
                {document.sourceUrl && (
                  <div className="flex flex-col gap-1">
                    <span className="text-muted-foreground">Source URL:</span>
                    <a
                      href={document.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:underline truncate"
                    >
                      {document.sourceUrl}
                    </a>
                  </div>
                )}
                {document.fileSize && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">File Size:</span>
                    <span>{document.fileSize}</span>
                  </div>
                )}
                {document.fileType && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">File Type:</span>
                    <span>{document.fileType}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Content Chunks ({chunks.length})</CardTitle>
              <CardDescription>
                These chunks are used for retrieval during chat conversations.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {chunks.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    {document.status === 'processing'
                      ? 'Document is still being processed...'
                      : document.status === 'failed'
                      ? 'Document processing failed.'
                      : 'No content chunks available.'}
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {chunks.map((chunk) => (
                    <Card key={chunk.id}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm text-muted-foreground">
                            Chunk {chunk.chunkIndex}
                          </span>
                        </div>
                        <p className="whitespace-pre-wrap text-sm">
                          {chunk.content.length > 300
                            ? `${chunk.content.substring(0, 300)}...`
                            : chunk.content}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Document</DialogTitle>
            <DialogDescription>
              Update the document details.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-title" className="text-right">
                Title
              </Label>
              <Input
                id="edit-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-description" className="text-right">
                Description
              </Label>
              <Textarea
                id="edit-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="col-span-3"
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="submit"
              onClick={handleUpdateDocument}
              disabled={isUpdating || !title}
            >
              {isUpdating ? 'Updating...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Delete Document</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this document? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteDocument}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 