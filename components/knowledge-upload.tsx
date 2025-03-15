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
import { VoiceRecorder } from '@/components/voice-recorder';
import { AudioUpload } from '@/components/audio-upload';
import { TranscriptionProgress } from '@/components/transcription-progress';
import { toast } from 'sonner';
import { FileTextIcon, MicIcon, UploadIcon } from 'lucide-react';

interface KnowledgeUploadProps {
  onSuccess?: () => void;
}

export function KnowledgeUpload({ onSuccess }: KnowledgeUploadProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<'text' | 'record' | 'upload'>('text');
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [textContent, setTextContent] = useState('');
  
  // Audio states
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [processingDocumentId, setProcessingDocumentId] = useState<string | null>(null);
  const [isTranscriptionCompleted, setIsTranscriptionCompleted] = useState(false);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setTextContent('');
    setAudioFile(null);
    setAudioBlob(null);
    setProcessingDocumentId(null);
    setIsTranscriptionCompleted(false);
    setActiveTab('text');
  };

  const handleTextSubmit = async () => {
    try {
      setIsUploading(true);

      // Validate form
      if (!title) {
        toast.error('Title is required');
        setIsUploading(false);
        return;
      }

      if (!textContent) {
        toast.error('Content is required');
        setIsUploading(false);
        return;
      }

      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('sourceType', 'text');
      formData.append('content', textContent);

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
  
  const handleAudioUploadSubmit = async () => {
    try {
      setIsUploading(true);
      
      // Validate form
      if (!title) {
        toast.error('Title is required');
        setIsUploading(false);
        return;
      }
      
      if (!audioFile) {
        toast.error('Audio file is required');
        setIsUploading(false);
        return;
      }
      
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('file', audioFile);
      
      const response = await fetch('/api/knowledge/audio', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload audio');
      }
      
      const responseData = await response.json();
      
      toast.success('Audio added successfully');
      setProcessingDocumentId(responseData.id);
      
    } catch (error) {
      console.error('Error adding audio:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to add audio');
      setIsUploading(false);
    }
  };
  
  const handleRecordingSubmit = async () => {
    try {
      setIsUploading(true);
      
      // Validate form
      if (!title) {
        toast.error('Title is required');
        setIsUploading(false);
        return;
      }
      
      if (!audioBlob) {
        toast.error('Voice recording is required');
        setIsUploading(false);
        return;
      }
      
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('audioBlob', audioBlob);
      
      const response = await fetch('/api/knowledge/audio/record', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload recording');
      }
      
      const responseData = await response.json();
      
      toast.success('Recording added successfully');
      setProcessingDocumentId(responseData.id);
      
    } catch (error) {
      console.error('Error adding recording:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to add recording');
      setIsUploading(false);
    }
  };
  
  const handleSubmit = () => {
    switch (activeTab) {
      case 'text':
        handleTextSubmit();
        break;
      case 'upload':
        handleAudioUploadSubmit();
        break;
      case 'record':
        handleRecordingSubmit();
        break;
    }
  };
  
  const handleTranscriptionComplete = () => {
    setIsTranscriptionCompleted(true);
    setIsUploading(false);
    
    if (onSuccess) {
      onSuccess();
    }
    
    // Automatically close the dialog after a delay
    setTimeout(() => {
      setIsOpen(false);
      resetForm();
    }, 2000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      // Only allow closing if not currently uploading
      if (!isUploading || isTranscriptionCompleted) {
        setIsOpen(open);
        if (!open) resetForm();
      }
    }}>
      <DialogTrigger asChild>
        <Button>
          <PlusIcon className="mr-2" size={16} />
          Add Document
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add Knowledge Document</DialogTitle>
          <DialogDescription>
            Add content to your knowledge base for AI to reference during chats.
          </DialogDescription>
        </DialogHeader>
        
        {processingDocumentId ? (
          <div className="py-4">
            <h3 className="text-lg font-medium mb-4">Processing Audio</h3>
            <TranscriptionProgress 
              documentId={processingDocumentId}
              onCompleted={handleTranscriptionComplete}
            />
          </div>
        ) : (
          <>
            {/* Custom Tab Navigation */}
            <div className="flex space-x-2 mb-6">
              <Button
                variant={activeTab === 'text' ? 'default' : 'outline'}
                onClick={() => setActiveTab('text')}
                className="flex items-center gap-2"
              >
                <FileTextIcon className="h-4 w-4" />
                <span>Text</span>
              </Button>
              <Button
                variant={activeTab === 'record' ? 'default' : 'outline'}
                onClick={() => setActiveTab('record')}
                className="flex items-center gap-2"
              >
                <MicIcon className="h-4 w-4" />
                <span>Record Voice</span>
              </Button>
              <Button
                variant={activeTab === 'upload' ? 'default' : 'outline'}
                onClick={() => setActiveTab('upload')}
                className="flex items-center gap-2"
              >
                <UploadIcon className="h-4 w-4" />
                <span>Upload Audio</span>
              </Button>
            </div>
            
            <div className="space-y-4 mb-4">
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
                <Input
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="col-span-3"
                  placeholder="Optional description"
                />
              </div>
            </div>
            
            {/* Text Content */}
            {activeTab === 'text' && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="textContent" className="text-right">
                  Content
                </Label>
                <Textarea
                  id="textContent"
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  className="col-span-3"
                  rows={10}
                  placeholder="Paste your text content here..."
                />
              </div>
            )}
            
            {/* Record Voice */}
            {activeTab === 'record' && (
              <VoiceRecorder
                onRecordingComplete={(blob) => setAudioBlob(blob)}
                onCancel={() => setActiveTab('text')}
              />
            )}
            
            {/* Upload Audio */}
            {activeTab === 'upload' && (
              <AudioUpload
                onFileSelected={(file) => setAudioFile(file)}
                onCancel={() => setActiveTab('text')}
              />
            )}

            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsOpen(false);
                  resetForm();
                }}
                disabled={isUploading}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSubmit}
                disabled={isUploading || (activeTab === 'upload' && !audioFile) || (activeTab === 'record' && !audioBlob)}
              >
                {isUploading ? 'Processing...' : 'Add Document'}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}