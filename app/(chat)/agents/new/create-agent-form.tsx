'use client';

import { useState, forwardRef, useImperativeHandle } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Dropzone } from '@/components/ui/shadcn-io/dropzone';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { UploadIcon } from 'lucide-react';

export interface CreateAgentFormHandle {
  submit: () => void;
  isSubmitting: boolean;
}

interface CreateAgentFormState {
  name: string;
  description: string;
  agentPrompt: string;
  isPublic: boolean;
  vectorStoreId?: string;
}

interface CreateAgentFormProps {
  formData: CreateAgentFormState;
  onFormDataChange: (data: CreateAgentFormState) => void;
}

export const CreateAgentForm = forwardRef<
  CreateAgentFormHandle,
  CreateAgentFormProps
>(({ formData, onFormDataChange }, ref) => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingKnowledge, setIsUploadingKnowledge] = useState(false);
  const [uploadedKnowledge, setUploadedKnowledge] = useState<
    Array<{ id: string; name: string; status: string; size: number }>
  >([]);

  const handleInputChange = (field: string, value: string | boolean) => {
    onFormDataChange({
      ...formData,
      [field]: value,
    });
  };

  const uploadKnowledge = async (files: Array<File>) => {
    if (files.length === 0) return;

    setIsUploadingKnowledge(true);

    try {
      const payload = new FormData();
      files.forEach((file) => {
        payload.append('files', file);
      });

      if (formData.vectorStoreId) {
        payload.append('vectorStoreId', formData.vectorStoreId);
      }

      const uploadResponse = await fetch('/api/vector-stores', {
        method: 'POST',
        body: payload,
      });

      if (!uploadResponse.ok) {
        const error = await uploadResponse.text();
        throw new Error(error || 'Failed to upload knowledge files');
      }

      const result = await uploadResponse.json();

      if (
        result.vectorStoreId &&
        result.vectorStoreId !== formData.vectorStoreId
      ) {
        onFormDataChange({ ...formData, vectorStoreId: result.vectorStoreId });
      }

      if (Array.isArray(result.uploaded)) {
        setUploadedKnowledge((prev) => {
          const merged = [...prev, ...result.uploaded];
          const unique = new Map<
            string,
            {
              id: string;
              name: string;
              status: string;
              size: number;
            }
          >();
          for (const entry of merged) {
            unique.set(entry.id, entry);
          }
          return Array.from(unique.values());
        });
      }

      toast.success('Knowledge files uploaded');
    } catch (error) {
      console.error('Knowledge upload error:', error);
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to upload knowledge files',
      );
    } finally {
      setIsUploadingKnowledge(false);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Agent name is required');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/agents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Failed to create agent');
      }

      toast.success('Agent created successfully!');
      router.push('/agents');
    } catch (error) {
      console.error('Error creating agent:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to create agent',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  useImperativeHandle(ref, () => ({
    submit: handleSubmit,
    isSubmitting: isSubmitting || isUploadingKnowledge,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-1">Agent Configuration</h2>
        <p className="text-sm text-muted-foreground">
          Configure your agent&apos;s behavior and settings
        </p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="name">Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            placeholder="My Custom Agent"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Input
            id="description"
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            placeholder="A brief description of what this agent does"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="agentPrompt">Agent Prompt</Label>
          <Textarea
            id="agentPrompt"
            value={formData.agentPrompt}
            onChange={(e) => handleInputChange('agentPrompt', e.target.value)}
            placeholder="You are a helpful AI assistant that..."
            rows={6}
            className="resize-none"
          />
          <p className="text-sm text-muted-foreground">
            This prompt will be used as the system message for this agent
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="isPublic"
            checked={formData.isPublic}
            onCheckedChange={(checked) =>
              handleInputChange('isPublic', checked)
            }
          />
          <Label htmlFor="isPublic">Make this agent public</Label>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="knowledge">Knowledge Files</Label>
            {uploadedKnowledge.length > 0 && (
              <Badge variant="secondary">
                {uploadedKnowledge.length} uploaded
              </Badge>
            )}
          </div>
          <Dropzone
            multiple
            maxFiles={10}
            onDrop={uploadKnowledge}
            disabled={isSubmitting || isUploadingKnowledge}
            accept={{
              'text/css': ['.css'],
              'application/msword': ['.doc'],
              'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
                ['.docx'],
              'text/x-golang': ['.go'],
              'text/html': ['.html'],
              'text/x-java': ['.java'],
              'text/javascript': ['.js'],
              'application/json': ['.json'],
              'text/markdown': ['.md'],
              'application/pdf': ['.pdf'],
              'application/vnd.openxmlformats-officedocument.presentationml.presentation':
                ['.pptx'],
              'application/typescript': ['.ts'],
              'text/plain': ['.txt'],
            }}
            validator={(file) => {
              if (file.name.length > 64) {
                return {
                  code: 'filename-too-long',
                  message: `Filename "${file.name}" is too long (${file.name.length} characters). Maximum allowed is 64 characters.`,
                };
              }
              return null;
            }}
          >
            <div className="flex flex-col items-center justify-center gap-2 text-center">
              <div className="flex size-8 items-center justify-center rounded-md bg-muted text-muted-foreground">
                <UploadIcon size={16} />
              </div>
              <p className="text-sm font-medium">
                {isUploadingKnowledge
                  ? 'Uploading files...'
                  : 'Drag and drop or click to upload'}
              </p>
              <p className="text-xs text-muted-foreground">
                {formData.vectorStoreId
                  ? 'New files are added to this agent draft'
                  : 'Uploading creates a dedicated vector store'}
              </p>
            </div>
          </Dropzone>
          {uploadedKnowledge.length > 0 && (
            <div className="space-y-2 rounded-md border p-3 text-sm">
              <div className="flex items-center justify-between">
                <p className="font-medium">Uploaded this session</p>
                {formData.vectorStoreId && (
                  <span className="text-xs text-muted-foreground">
                    Vector store ID: {formData.vectorStoreId}
                  </span>
                )}
              </div>
              <ul className="list-disc pl-4">
                {uploadedKnowledge.map((file) => (
                  <li key={file.id} className="truncate">
                    {file.name}
                    <span className="ml-2 text-xs text-muted-foreground">
                      {file.status}
                    </span>
                  </li>
                ))}
              </ul>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setUploadedKnowledge([])}
              >
                Clear list
              </Button>
              <p className="text-xs text-muted-foreground">
                Clearing only removes this preview list; files stay in the
                vector store.
              </p>
            </div>
          )}
        </div>
      </form>
    </div>
  );
});

CreateAgentForm.displayName = 'CreateAgentForm';
