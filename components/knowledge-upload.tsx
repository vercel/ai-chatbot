'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { PlusIcon } from '@/components/icons';
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

interface KnowledgeUploadProps {
  onSuccess?: () => void;
}

export function KnowledgeUpload({ onSuccess }: KnowledgeUploadProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [sourceType, setSourceType] = useState<'pdf' | 'text' | 'url' | 'audio' | 'video' | 'youtube'>('text');
  const [sourceUrl, setSourceUrl] = useState('');
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [textContent, setTextContent] = useState('');

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setSourceType('text');
    setSourceUrl('');
    setFileToUpload(null);
    setTextContent('');
  };

  const handleSubmit = async () => {
    try {
      setIsUploading(true);

      // Validate form
      if (!title) {
        toast.error('Title is required');
        return;
      }

      if (sourceType === 'text' && !textContent) {
        toast.error('Content is required');
        return;
      }

      if ((sourceType === 'url' || sourceType === 'youtube') && !sourceUrl) {
        toast.error('URL is required');
        return;
      }

      if ((sourceType === 'pdf' || sourceType === 'audio' || sourceType === 'video') && !fileToUpload) {
        toast.error('File is required');
        return;
      }

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
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload document');
      }

      toast.success('Document added successfully');
      setIsOpen(false);
      resetForm();
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error adding document:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to add document');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
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
                  if (e.target.files && e.target.files.length > 0) {
                    setFileToUpload(e.target.files[0]);
                  }
                }}
                className="col-span-3"
                accept={
                  sourceType === 'pdf'
                    ? '.pdf'
                    : sourceType === 'audio'
                    ? '.mp3,.wav,.ogg'
                    : '.mp4,.mov,.avi'
                }
              />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => {
              setIsOpen(false);
              resetForm();
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={isUploading}
          >
            {isUploading ? 'Uploading...' : 'Add Document'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 