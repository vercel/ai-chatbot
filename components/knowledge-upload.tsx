'use client';

import { useState, useEffect } from 'react';
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
import { AudioUpload, AudioSummary, AudioMetadata } from '@/components/audio-upload';
import { toast } from 'sonner';
import { FileTextIcon, Globe, FileIcon, MicIcon, UploadIcon } from 'lucide-react';

interface KnowledgeUploadProps {
  onSuccess?: () => void;
}

interface FileUploadProps {
  onFileSelected: (file: File) => void;
  onCancel: () => void;
  accept?: string;
  label?: string;
}

// PDF File Upload Component
function PDFUpload({ onFileSelected, onCancel, accept = '.pdf', label = 'PDF File' }: FileUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      
      // Validate file type
      if (!selectedFile.name.toLowerCase().endsWith('.pdf')) {
        toast.error('Please select a valid PDF file');
        return;
      }
      
      setFile(selectedFile);
      onFileSelected(selectedFile);
    }
  };
  
  return (
    <div className="p-4 border rounded-md bg-muted/30">
      <div className="mb-4 text-center">
        <FileIcon className="mx-auto size-12 text-muted-foreground mb-2" />
        <h3 className="text-lg font-medium">{label}</h3>
        <p className="text-sm text-muted-foreground">Upload a PDF document to add to your knowledge base</p>
      </div>
      
      <div className="flex flex-col items-center justify-center gap-2">
        <Input
          type="file"
          accept={accept}
          onChange={handleFileChange}
          className="cursor-pointer"
        />
        
        {file && (
          <div className="mt-2 text-sm">
            <span className="font-medium">Selected file:</span> {file.name} ({(file.size / 1024).toFixed(2)} KB)
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Knowledge Upload Component
 * 
 * This component has been updated to use the new /api/knowledgeupload endpoint
 * instead of the previous endpoints which were experiencing routing issues in Next.js.
 * 
 * HISTORY OF CHANGES:
 * - Originally used /api/knowledge-base/upload
 * - Then tried /api/knowledge/create but encountered 405 Method Not Allowed error
 * - Then tried /api/kb-new which resulted in 404 Not Found error
 * - Now using /api/knowledgeupload with a simpler route structure
 */
export function KnowledgeUpload({ onSuccess }: KnowledgeUploadProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<'url' | 'text' | 'pdf' | 'audio'>('url');
  const [audioSubTab, setAudioSubTab] = useState<'upload'>('upload');
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [textContent, setTextContent] = useState('');
  const [url, setUrl] = useState('');
  const [notes, setNotes] = useState('');
  
  // File states
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioMetadata, setAudioMetadata] = useState<AudioMetadata | null>(null);
  const [audioSummary, setAudioSummary] = useState<boolean>(false);
  const [audioValidationError, setAudioValidationError] = useState<string>('');
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfExtractedText, setPdfExtractedText] = useState<string>('');
  const [showPdfExtractor, setShowPdfExtractor] = useState<boolean>(false);
  const [processingDocumentId, setProcessingDocumentId] = useState<string | null>(null);
  const [pollCount, setPollCount] = useState(0);
  
  // Format duration as mm:ss
  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Format bitrate to human-readable
  const formatBitrate = (bps: number) => {
    if (bps > 1000000) {
      return `${(bps / 1000000).toFixed(2)} Mbps`;
    } else if (bps > 1000) {
      return `${(bps / 1000).toFixed(1)} kbps`;
    }
    return `${bps} bps`;
  };

  const resetForm = () => {
    setUrl('');
    setNotes('');
    setTitle('');
    setDescription('');
    setTextContent('');
    setAudioFile(null);
    setAudioMetadata(null);
    setAudioSummary(false);
    setAudioValidationError('');
    setPdfFile(null);
    setPdfExtractedText('');
    setShowPdfExtractor(false);
    setProcessingDocumentId(null);
    setPollCount(0);
    setActiveTab('url');
    setAudioSubTab('upload');
  };

  const handleTextSubmit = async () => {
    try {
      setIsUploading(true);
      console.log('[KnowledgeUpload] Starting text document submission');

      // Validate form
      if (!title) {
        console.log('[KnowledgeUpload] Validation failed: Missing title');
        toast.error('Title is required');
        setIsUploading(false);
        return;
      }

      if (!textContent) {
        console.log('[KnowledgeUpload] Validation failed: Missing content');
        toast.error('Content is required');
        setIsUploading(false);
        return;
      }

      // Create form data
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('sourceType', 'text');
      formData.append('content', textContent);
      console.log(`[KnowledgeUpload] Form data prepared: title="${title}", content length=${textContent.length}`);

      // Use our knowledge-new endpoint
      console.log('[KnowledgeUpload] Submitting to /api/knowledge-new endpoint');
      console.log('[KnowledgeUpload] Form data contents (text document):', {
        title,
        description,
        sourceType: 'text',
        contentLength: textContent.length
      });
      
      // Print out all form data entries to debug
      for (const [key, value] of formData.entries()) {
        if (key === 'content') {
          console.log(`[KnowledgeUpload] FormData entry: ${key} = [${(value as string).length} chars]`);
        } else {
          console.log(`[KnowledgeUpload] FormData entry: ${key} = ${value}`);
        }
      }
      const response = await fetch('/api/knowledge-new', {
        method: 'POST',
        body: formData,
      });

      console.log(`[KnowledgeUpload] Response received: status=${response.status}, statusText="${response.statusText}"`);
      
      // Parse the response body - do this before checking response.ok to get error details
      let responseData;
      try {
        responseData = await response.json();
        console.log('[KnowledgeUpload] Response data:', responseData);
      } catch (parseError) {
        console.error('[KnowledgeUpload] Failed to parse response as JSON:', parseError);
      }

      // Handle non-success responses
      if (!response.ok) {
        // Construct error message using response data if available
        let errorMessage = `Request failed with status ${response.status}`;
        
        if (responseData?.error) {
          errorMessage = responseData.message || responseData.error;
          if (responseData.details) {
            errorMessage += `: ${responseData.details}`;
          }
        }
        
        console.error(`[KnowledgeUpload] Error response: ${errorMessage}`);
        throw new Error(errorMessage);
      }

      // Process successful response
      console.log('[KnowledgeUpload] Document added successfully:', responseData?.id);
      toast.success('Document added successfully');
      setIsOpen(false);
      resetForm();
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('[KnowledgeUpload] Error adding document:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to add document');
    } finally {
      setIsUploading(false);
    }
  };
  
  const handleAudioSubmit = async () => {
    try {
      setIsUploading(true);
      console.log('[KnowledgeUpload] Starting audio document submission');

      // Validate form
      if (!title) {
        console.log('[KnowledgeUpload] Validation failed: Missing title');
        toast.error('Title is required');
        setIsUploading(false);
        return;
      }

      if (!audioFile || !audioMetadata) {
        console.log('[KnowledgeUpload] Validation failed: Missing audio file or metadata');
        toast.error('Audio file is required');
        setIsUploading(false);
        return;
      }

      // Create form data
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('sourceType', 'audio');
      formData.append('file', audioFile);
      formData.append('language', audioMetadata.language); // Pass the selected language
      console.log(`[KnowledgeUpload] Form data prepared: title="${title}", audio file=${audioFile.name}, language=${audioMetadata.language}`);

      // Use our knowledge-new endpoint
      console.log('[KnowledgeUpload] Submitting to /api/knowledge-new endpoint');
      console.log('[KnowledgeUpload] Form data contents (audio document):', {
        title,
        description,
        sourceType: 'audio',
        audioFileName: audioFile.name,
        audioFileSize: audioFile.size,
        language: audioMetadata.language
      });
      
      // Print out all form data entries to debug
      for (const [key, value] of formData.entries()) {
        if (key === 'file') {
          console.log(`[KnowledgeUpload] FormData entry: ${key} = [File: ${(value as File).name}, ${(value as File).size} bytes]`);
        } else {
          console.log(`[KnowledgeUpload] FormData entry: ${key} = ${value}`);
        }
      }
      const response = await fetch('/api/knowledge-new', {
        method: 'POST',
        body: formData,
      });

      console.log(`[KnowledgeUpload] Response received: status=${response.status}, statusText="${response.statusText}"`);
      
      // Parse the response body - do this before checking response.ok to get error details
      let responseData;
      try {
        responseData = await response.json();
        console.log('[KnowledgeUpload] Response data:', responseData);
      } catch (parseError) {
        console.error('[KnowledgeUpload] Failed to parse response as JSON:', parseError);
      }

      // Handle non-success responses
      if (!response.ok) {
        // Construct error message using response data if available
        let errorMessage = `Request failed with status ${response.status}`;
        
        if (responseData?.error) {
          errorMessage = responseData.message || responseData.error;
          if (responseData.details) {
            errorMessage += `: ${responseData.details}`;
          }
        }
        
        console.error(`[KnowledgeUpload] Error response: ${errorMessage}`);
        throw new Error(errorMessage);
      }

      // Process successful response
      console.log('[KnowledgeUpload] Audio document added successfully:', responseData?.id);
      toast.success('Audio file uploaded and processing started');
      setIsOpen(false);
      resetForm();
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('[KnowledgeUpload] Error adding audio document:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to add audio document');
    } finally {
      setIsUploading(false);
    }
  };
  
  const handleUrlSubmit = async () => {
    console.log('[KnowledgeUpload] Starting URL document submission with debug logs enabled');
    try {
      setIsUploading(true);
      console.log('[KnowledgeUpload] Starting URL document submission');

      // Validate form
      if (!title) {
        console.log('[KnowledgeUpload] Validation failed: Missing title');
        toast.error('Title is required');
        setIsUploading(false);
        return;
      }

      if (!url) {
        console.log('[KnowledgeUpload] Validation failed: Missing URL');
        toast.error('URL is required');
        setIsUploading(false);
        return;
      }

      // Validate URL format
      try {
        let urlToCheck = url;
        // Add protocol if missing
        if (!urlToCheck.startsWith('http://') && !urlToCheck.startsWith('https://')) {
          urlToCheck = 'https://' + urlToCheck;
          setUrl(urlToCheck);
        }
        new URL(urlToCheck);
      } catch (e) {
        console.log(`[KnowledgeUpload] Validation failed: Invalid URL format: ${url}`);
        toast.error('Please enter a valid URL (e.g., https://example.com)');
        setIsUploading(false);
        return;
      }

      // Create form data
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('sourceType', 'url');
      formData.append('sourceUrl', url);
      formData.append('notes', notes);
      console.log(`[KnowledgeUpload] Form data prepared: title="${title}", URL=${url}`);
      
      // Print out all form data entries to debug
      console.log('[KnowledgeUpload] Form data entries for URL submission:');
      for (const [key, value] of formData.entries()) {
        console.log(`[KnowledgeUpload] FormData entry: ${key} = ${value}`);
      }

      // Use our knowledge-new endpoint
      console.log('[KnowledgeUpload] Submitting to /api/knowledge-new endpoint');
      const response = await fetch('/api/knowledge-new', {
        method: 'POST',
        body: formData,
      });

      console.log(`[KnowledgeUpload] Response received: status=${response.status}, statusText="${response.statusText}"`);
      
      // Parse the response body - do this before checking response.ok to get error details
      let responseData;
      try {
        responseData = await response.json();
        console.log('[KnowledgeUpload] Response data:', responseData);
      } catch (parseError) {
        console.error('[KnowledgeUpload] Failed to parse response as JSON:', parseError);
      }

      // Handle non-success responses
      if (!response.ok) {
        // Construct error message using response data if available
        let errorMessage = `Request failed with status ${response.status}`;
        
        if (responseData?.error) {
          errorMessage = responseData.message || responseData.error;
          if (responseData.details) {
            errorMessage += `: ${responseData.details}`;
          }
        }
        
        console.error(`[KnowledgeUpload] Error response: ${errorMessage}`);
        throw new Error(errorMessage);
      }

      // Process successful response
      console.log('[KnowledgeUpload] URL document added successfully:', responseData?.id);
      toast.success('URL added successfully and is being processed');
      setIsOpen(false);
      resetForm();
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('[KnowledgeUpload] Error adding URL:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to add URL');
    } finally {
      setIsUploading(false);
    }
  };

  // PDF handling is now integrated into the text tab with client-side extraction

  const handleSubmit = () => {
    switch (activeTab) {
      case 'url':
        handleUrlSubmit();
        break;
      case 'text':
        handleTextSubmit();
        break;
      case 'audio':
        handleAudioSubmit();
        break;
      default:
        console.error('Unknown tab selected:', activeTab);
    }
  };
  
  // Add effect to reset audio validation when tab changes
  useEffect(() => {
    if (activeTab !== 'audio') {
      setAudioSummary(false);
      setAudioValidationError('');
    }
  }, [activeTab]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      // Only allow closing if not currently uploading
      if (!isUploading) {
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
      <DialogContent className="sm:max-w-[600px] dark:bg-hunter_green-700 dark:text-white">
        <DialogHeader>
          <DialogTitle>Add Knowledge Document</DialogTitle>
          <DialogDescription className="dark:text-gray-300">
            Add content to your knowledge base for AI to reference during chats.
          </DialogDescription>
        </DialogHeader>
        
        <>
          {/* Main Tab Navigation */}
          <div className="flex space-x-2 mb-6">
            <Button
              variant={activeTab === 'url' ? 'default' : 'outline'}
              onClick={() => setActiveTab('url')}
              className="flex items-center gap-2"
            >
              <Globe className="size-4" />
              <span>URL</span>
            </Button>
            <Button
              variant={activeTab === 'text' ? 'default' : 'outline'}
              onClick={() => setActiveTab('text')}
              className="flex items-center gap-2"
            >
              <FileTextIcon className="size-4" />
              <span>Text & Documents</span>
            </Button>
            <Button
              variant={activeTab === 'audio' ? 'default' : 'outline'}
              onClick={() => setActiveTab('audio')}
              className="flex items-center gap-2"
            >
              <MicIcon className="size-4" />
              <span>Audio</span>
            </Button>
          </div>
          
          {/* Audio Sub-tabs */}
          {activeTab === 'audio' && (
            <div className="flex space-x-2 mt-2">
              <Button
                variant={audioSubTab === 'upload' ? 'secondary' : 'outline'}
                onClick={() => setAudioSubTab('upload')}
                size="sm"
                className="text-sm"
              >
                <UploadIcon className="size-3 mr-1" />
                Upload
              </Button>
            </div>
          )}
          
          <div className="space-y-4 mb-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="title" className="text-right dark:text-white">
                Title
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="col-span-3 dark:bg-hunter_green-600 dark:text-white dark:border-hunter_green-500"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right dark:text-white">
                Description
              </Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="col-span-3 dark:bg-hunter_green-600 dark:text-white dark:border-hunter_green-500"
                placeholder="Optional description"
              />
            </div>
          </div>
          
          {/* URL Content */}
          {activeTab === 'url' && (
            <div className="space-y-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="url" className="text-right dark:text-white">
                  URL
                </Label>
                <Input
                  id="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="col-span-3 dark:bg-hunter_green-600 dark:text-white dark:border-hunter_green-500"
                  placeholder="https://example.com/page"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor="notes" className="text-right pt-2 dark:text-white">
                  Notes
                </Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="col-span-3 dark:bg-hunter_green-600 dark:text-white dark:border-hunter_green-500"
                  rows={6}
                  placeholder="Optional notes about this URL..."
                />
              </div>
            </div>
          )}
          
          {/* Text Content with Document Upload */}
          {activeTab === 'text' && (
            <div className="space-y-4">
              <div className="grid grid-cols-4 items-start gap-4">                  
                <Label htmlFor="textContent" className="text-right pt-2 dark:text-white">
                  Content
                </Label>
                <div className="col-span-3 space-y-2">
                  <div className="flex justify-end gap-2 mb-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      className="text-xs flex items-center gap-1 dark:bg-hunter_green-600 dark:text-white dark:border-hunter_green-500 dark:hover:bg-hunter_green-500"
                      onClick={() => {
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.accept = '.pdf,.txt,.md,.doc,.docx';
                        input.onchange = async (e) => {
                          const file = (e.target as HTMLInputElement).files?.[0];
                          if (!file) return;
                          
                          try {
                            // Show loading state
                            toast.info(`Extracting text from ${file.name}...`);
                            
                            if (file.name.toLowerCase().endsWith('.pdf')) {
                              // Extract text from PDF using the browser PDF extractor
                              const { extractTextFromPdf, loadPdfJs } = await import('@/lib/knowledge/browser/pdfExtractor');
                              await loadPdfJs();
                              const extractedText = await extractTextFromPdf(file);
                              setTextContent(prev => prev ? `${prev}\n\n${extractedText}` : extractedText);
                              setTitle(prev => prev || file.name.replace('.pdf', ''));
                            } else {
                              // For text files, just read the text
                              const text = await file.text();
                              setTextContent(prev => prev ? `${prev}\n\n${text}` : text);
                              setTitle(prev => prev || file.name.split('.')[0]);
                            }
                            
                            toast.success(`Text extracted from ${file.name}`);
                          } catch (error) {
                            console.error('Error extracting text:', error);
                            toast.error(`Failed to extract text from ${file.name}`);
                          }
                        };
                        input.click();
                      }}
                    >
                      <FileIcon className="size-3" />
                      Upload Document
                    </Button>
                  </div>
                  <Textarea
                    id="textContent"
                    value={textContent}
                    onChange={(e) => setTextContent(e.target.value)}
                    className="min-h-[300px] dark:bg-hunter_green-600 dark:text-white dark:border-hunter_green-500"
                    placeholder="Paste your text content here or upload a document..."
                  />
                </div>
              </div>
            </div>
          )}
          
          {/* Audio Upload Content */}
          {activeTab === 'audio' && audioSubTab === 'upload' && !audioSummary && (
            <div className="space-y-4">
              <AudioUpload 
                onFileSelected={(file, metadata) => {
                  setAudioFile(file);
                  setAudioMetadata(metadata);
                  setAudioSummary(true);
                }}
                onFileRejected={(error) => setAudioValidationError(error)}
              />
              
              {audioValidationError && (
                <div className="mt-2 text-sm text-red-500">
                  {audioValidationError}
                </div>
              )}
            </div>
          )}

          {/* Audio Summary View */}
          {activeTab === 'audio' && audioSummary && audioFile && audioMetadata && (
            <div className="space-y-4">
              <AudioSummary 
                file={audioFile}
                metadata={audioMetadata}
                onChangeFile={() => {
                  setAudioSummary(false);
                  setAudioFile(null);
                  setAudioMetadata(null);
                }}
              />
            </div>
          )}

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsOpen(false);
                resetForm();
              }}
              disabled={isUploading}
              className="dark:bg-hunter_green-600 dark:text-white dark:border-hunter_green-500 dark:hover:bg-hunter_green-500"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={isUploading || 
                (activeTab === 'url' && !url) || 
                (activeTab === 'text' && !textContent) ||
                (activeTab === 'audio' && (!audioFile || !audioSummary))}
              className="dark:bg-hunter_green-500 dark:text-white dark:hover:bg-hunter_green-400"
            >
              {isUploading ? (
                <>
                  <div className="animate-spin size-4 mr-2 border-b-2 border-current rounded-full"></div>
                  Processing...
                </>
              ) : (
                activeTab === 'url' ? 'Add Link' : 
                activeTab === 'audio' ? 'Add Audio' : 'Add Document'
              )}
            </Button>
          </DialogFooter>
        </>
      </DialogContent>
    </Dialog>
  );
}