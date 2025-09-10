import React from 'react';
import { Artifact } from '@/components/create-artifact';
import { DocumentSkeleton } from '@/components/document-skeleton';
import { Response } from '@/components/elements/response';
import {
  CopyIcon,
  DownloadIcon,
} from '@/components/icons';
import { CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export const textArtifact = new Artifact<'text'>({
  kind: 'text',
  description: 'Conflict of Interest Disclosure Document',
  
  onStreamPart: ({ streamPart, setArtifact }) => {
    if (streamPart.type === 'data-textDelta') {
      setArtifact((draftArtifact) => ({
        ...draftArtifact,
        content: draftArtifact.content + streamPart.data,
        isVisible: true,
        status: 'streaming',
      }));
    }
  },
  
  content: ({ content, isLoading }) => {
    if (isLoading) {
      return <DocumentSkeleton />;
    }

    return (
      <div className="max-w-4xl mx-auto p-8">
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
          <div className="p-8">
            <Response className="prose prose-lg max-w-none">
              {content}
            </Response>
          </div>
        </div>
      </div>
    );
  },
  
  actions: [
    {
      icon: <CopyIcon size={18} />,
      description: 'Copy to clipboard',
      onClick: ({ content }) => {
        navigator.clipboard.writeText(content);
        toast.success('Copied to clipboard!');
      },
    },
    {
      icon: <DownloadIcon size={18} />,
      description: 'Download as text',
      onClick: async ({ content }) => {
        try {
          const blob = new Blob([content], { type: 'text/plain' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'coi-disclosure.txt';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          toast.success('Document downloaded!');
        } catch (error) {
          console.error('Download error:', error);
          toast.error('Failed to download document');
        }
      },
    },
    {
      icon: <CheckCircle size={18} />,
      description: 'Submit for Review',
      onClick: async ({ content }) => {
        try {
          const response = await fetch('/api/conflict-reports', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              documentId: crypto.randomUUID(),
              content,
              priority: 'medium',
            }),
          });

          const result = await response.json();

          if (response.ok) {
            toast.success('COI disclosure submitted for review!');
          } else {
            toast.error(result.error || 'Failed to submit for review');
          }
        } catch (error) {
          console.error('Submit error:', error);
          toast.error('Failed to submit for review');
        }
      },
      isDisabled: ({ isCurrentVersion }) => !isCurrentVersion,
    },
  ],
  toolbar: [],
});