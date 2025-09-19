'use client';

import {
  useState,
  forwardRef,
  useImperativeHandle,
  useCallback,
  useEffect,
} from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import type { Agent } from '@/lib/db/schema';
import { Dropzone } from '@/components/ui/shadcn-io/dropzone';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { UploadIcon } from 'lucide-react';

export interface EditAgentFormHandle {
  submit: () => void;
  isSubmitting: boolean;
}

interface EditAgentFormState {
  name: string;
  description: string;
  agentPrompt: string;
  isPublic: boolean;
  vectorStoreId?: string | null;
}

interface EditAgentFormProps {
  agent: Agent;
  formData: EditAgentFormState;
  onFormDataChange: (data: EditAgentFormState) => void;
}

export const EditAgentForm = forwardRef<
  EditAgentFormHandle,
  EditAgentFormProps
>(({ agent, formData, onFormDataChange }, ref) => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingKnowledge, setIsUploadingKnowledge] = useState(false);
  const [isLoadingExisting, setIsLoadingExisting] = useState(false);
  const [existingKnowledge, setExistingKnowledge] = useState<
    Array<{ id: string; name: string; status: string }>
  >([]);
  const [uploadedKnowledge, setUploadedKnowledge] = useState<
    Array<{ id: string; name: string; status: string; size: number }>
  >([]);

  const loadExistingKnowledge = useCallback(
    async (storeIdOverride?: string) => {
      const storeId =
        storeIdOverride ?? formData.vectorStoreId ?? agent.vectorStoreId;
      if (!storeId) {
        setExistingKnowledge([]);
        return;
      }

      setIsLoadingExisting(true);

      try {
        const response = await fetch(`/api/vector-stores/${storeId}`);

        if (!response.ok) {
          const error = await response.text();
          throw new Error(error || 'Failed to load knowledge files');
        }

        const data = await response.json();

        if (Array.isArray(data.files)) {
          setExistingKnowledge(
            data.files.map((file: any) => ({
              id: file.id,
              name: file.name,
              status: file.status,
            })),
          );
        }
      } catch (error) {
        console.error('Failed to list vector store files', error);
        toast.error(
          error instanceof Error
            ? error.message
            : 'Unable to load existing knowledge files',
        );
      } finally {
        setIsLoadingExisting(false);
      }
    },
    [agent.vectorStoreId, formData.vectorStoreId],
  );

  useEffect(() => {
    void loadExistingKnowledge();
  }, [loadExistingKnowledge]);

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
      files.forEach((file) => payload.append('files', file));
      payload.append('agentSlug', agent.slug);

      const vectorStoreId = formData.vectorStoreId ?? agent.vectorStoreId;
      if (vectorStoreId) {
        payload.append('vectorStoreId', vectorStoreId);
      }

      const response = await fetch('/api/vector-stores', {
        method: 'POST',
        body: payload,
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Failed to upload knowledge files');
      }

      const data = await response.json();

      if (data.vectorStoreId && data.vectorStoreId !== formData.vectorStoreId) {
        onFormDataChange({ ...formData, vectorStoreId: data.vectorStoreId });
      }

      if (Array.isArray(data.uploaded)) {
        setUploadedKnowledge((prev) => {
          const merged = [...prev, ...data.uploaded];
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
      await loadExistingKnowledge(data.vectorStoreId);
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
      const response = await fetch(`/api/agents/${agent.slug}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Failed to update agent');
      }

      toast.success('Agent updated successfully!');
      router.push('/agents');
    } catch (error) {
      console.error('Error updating agent:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to update agent',
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
          Update your agent&apos;s behavior and settings
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

        <Separator className="my-4" />

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="knowledge">Knowledge Files</Label>
              {(formData.vectorStoreId || agent.vectorStoreId) && (
                <p className="text-xs text-muted-foreground">
                  Vector store ID:{' '}
                  {formData.vectorStoreId ?? agent.vectorStoreId}
                </p>
              )}
            </div>
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
              if (file.name.length > 63) {
                return {
                  code: 'filename-too-long',
                  message: `Filename "${file.name}" is too long (${file.name.length} characters). Maximum allowed is 63 characters.`,
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
                Files are added directly to this agent&apos;s vector store
              </p>
            </div>
          </Dropzone>
          {(formData.vectorStoreId || agent.vectorStoreId) && (
            <div className="space-y-2 rounded-md border p-3 text-sm">
              <div className="flex items-center justify-between">
                <p className="font-medium">Stored files</p>
                <span className="text-xs text-muted-foreground">
                  Vector store ID:{' '}
                  {formData.vectorStoreId ?? agent.vectorStoreId}
                </span>
              </div>
              {isLoadingExisting ? (
                <p className="text-xs text-muted-foreground">
                  Loading files...
                </p>
              ) : existingKnowledge.length > 0 ? (
                <ul className="list-disc pl-4">
                  {existingKnowledge.map((file) => (
                    <li key={file.id} className="truncate">
                      {file.name}
                      <span className="ml-2 text-xs text-muted-foreground">
                        {file.status}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-muted-foreground">
                  No files uploaded yet.
                </p>
              )}
            </div>
          )}
          {uploadedKnowledge.length > 0 && (
            <div className="space-y-2 rounded-md border p-3 text-sm">
              <p className="font-medium">Uploaded this session</p>
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
            </div>
          )}
        </div>
      </form>
    </div>
  );
});

EditAgentForm.displayName = 'EditAgentForm';
