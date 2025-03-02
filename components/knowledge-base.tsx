'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { KnowledgeDocument } from '@/lib/db/schema';
import { Button } from '@/components/ui/button';
import { PlusIcon, TrashIcon, FileIcon } from '@/components/icons';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

interface KnowledgeBaseProps {
  initialDocuments: KnowledgeDocument[];
  userId: string;
}

export function KnowledgeBase({ initialDocuments, userId }: KnowledgeBaseProps) {
  const router = useRouter();
  const [documents, setDocuments] = useState<KnowledgeDocument[]>(initialDocuments);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [sourceType, setSourceType] = useState<'pdf' | 'text' | 'url' | 'audio' | 'video' | 'youtube'>('text');
  const [sourceUrl, setSourceUrl] = useState('');
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [textContent, setTextContent] = useState('');

  const handleAddDocument = async () => {
    try {
      setIsUploading(true);

      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description || '');
      formData.append('sourceType', sourceType);
      
      if (sourceType === 'text') {
        formData.append('content', textContent);
      } else if (sourceType === 'url' || sourceType === 'youtube') {
        formData.append('sourceUrl', sourceUrl);
      } else if (fileToUpload) {
        formData.append('file', fileToUpload);
      }

      const response = await fetch('/api/knowledge', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload document');
      }

      const newDocument = await response.json();
      setDocuments([newDocument, ...documents]);
      
      // Reset form
      setTitle('');
      setDescription('');
      setSourceType('text');
      setSourceUrl('');
      setFileToUpload(null);
      setTextContent('');
      setIsAddDialogOpen(false);
      
      toast.success('Document added successfully');
      router.refresh();
    } catch (error) {
      console.error('Error adding document:', error);
      toast.error('Failed to add document');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteDocument = async (id: string) => {
    try {
      const response = await fetch(`/api/knowledge/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete document');
      }

      setDocuments(documents.filter(doc => doc.id !== id));
      toast.success('Document deleted successfully');
      router.refresh();
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

  const getSourceTypeIcon = (type: string) => {
    switch (type) {
      case 'pdf':
        return <FileIcon />;
      case 'text':
        return <FileIcon />;
      case 'url':
        return <FileIcon />;
      case 'audio':
        return <FileIcon />;
      case 'video':
        return <FileIcon />;
      case 'youtube':
        return <FileIcon />;
      default:
        return <FileIcon />;
    }
  };

  return (
    <div className="container py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Knowledge Base</h1>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusIcon className="mr-2" />
              Add Document
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Add Knowledge Document</DialogTitle>
              <DialogDescription>
                Upload a document to your knowledge base for AI to reference during chats.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="title" className="text-right">
                  Title
                </Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">
                  Description
                </Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="col-span-3"
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="sourceType" className="text-right">
                  Source Type
                </Label>
                <Select
                  value={sourceType}
                  onValueChange={(value) => 
                    setSourceType(value as 'pdf' | 'text' | 'url' | 'audio' | 'video' | 'youtube')
                  }
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select source type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Text</SelectItem>
                    <SelectItem value="pdf">PDF</SelectItem>
                    <SelectItem value="url">Web URL</SelectItem>
                    <SelectItem value="youtube">YouTube</SelectItem>
                    <SelectItem value="audio">Audio</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {sourceType === 'text' && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="textContent" className="text-right">
                    Content
                  </Label>
                  <Textarea
                    id="textContent"
                    value={textContent}
                    onChange={(e) => setTextContent(e.target.value)}
                    className="col-span-3"
                    rows={6}
                  />
                </div>
              )}

              {(sourceType === 'url' || sourceType === 'youtube') && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="sourceUrl" className="text-right">
                    URL
                  </Label>
                  <Input
                    id="sourceUrl"
                    value={sourceUrl}
                    onChange={(e) => setSourceUrl(e.target.value)}
                    className="col-span-3"
                    placeholder={sourceType === 'youtube' ? 'YouTube URL' : 'Web URL'}
                  />
                </div>
              )}

              {(sourceType === 'pdf' || sourceType === 'audio' || sourceType === 'video') && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="file" className="text-right">
                    File
                  </Label>
                  <Input
                    id="file"
                    type="file"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setFileToUpload(e.target.files[0]);
                      }
                    }}
                    className="col-span-3"
                    accept={
                      sourceType === 'pdf'
                        ? '.pdf'
                        : sourceType === 'audio'
                        ? 'audio/*'
                        : 'video/*'
                    }
                  />
                </div>
              )}
            </div>
            <DialogFooter>
              <Button 
                type="submit" 
                onClick={handleAddDocument}
                disabled={isUploading || !title || (sourceType === 'text' && !textContent) || 
                  ((sourceType === 'url' || sourceType === 'youtube') && !sourceUrl) ||
                  ((sourceType === 'pdf' || sourceType === 'audio' || sourceType === 'video') && !fileToUpload)}
              >
                {isUploading ? 'Uploading...' : 'Add Document'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {documents.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">No documents in your knowledge base yet.</p>
          <Button 
            onClick={() => setIsAddDialogOpen(true)}
            variant="outline"
          >
            <PlusIcon className="mr-2" />
            Add your first document
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {documents.map((doc) => (
            <Card key={doc.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    {getSourceTypeIcon(doc.sourceType)}
                    <CardTitle className="text-lg truncate">{doc.title}</CardTitle>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteDocument(doc.id)}
                    className="h-8 w-8 p-0"
                  >
                    <TrashIcon />
                    <span className="sr-only">Delete</span>
                  </Button>
                </div>
                <CardDescription className="truncate">
                  {doc.description || 'No description'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Type:</span>
                    <span className="capitalize">{doc.sourceType}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Status:</span>
                    <span className={getStatusColor(doc.status)}>
                      {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Added:</span>
                    <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => router.push(`/knowledge/${doc.id}`)}
                >
                  View Details
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
} 