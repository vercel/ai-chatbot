import React from 'react';
import { Artifact } from '@/components/create-artifact';
import { DiffView } from '@/components/diffview';
import { DocumentSkeleton } from '@/components/document-skeleton';
import { Editor } from '@/components/text-editor';
import { Document, Page, Text, pdf, StyleSheet } from '@react-pdf/renderer';
import {
  ClockRewind,
  CopyIcon,
  DownloadIcon,
  MessageIcon,
  PenIcon,
  RedoIcon,
  UndoIcon,
} from '@/components/icons';
import { CheckCircle } from 'lucide-react';
import type { Suggestion } from '@/lib/db/schema';
import { toast } from 'sonner';
import { getSuggestions } from '../actions';

interface TextArtifactMetadata {
  suggestions: Array<Suggestion>;
}

export const textArtifact = new Artifact<'text', TextArtifactMetadata>({
  kind: 'text',
  description: 'Useful for text content, like drafting essays and emails.',
  initialize: async ({ documentId, setMetadata }) => {
    const suggestions = await getSuggestions({ documentId });

    setMetadata({
      suggestions,
    });
  },
  onStreamPart: ({ streamPart, setMetadata, setArtifact }) => {
    if (streamPart.type === 'data-suggestion') {
      setMetadata((metadata) => {
        return {
          suggestions: [...metadata.suggestions, streamPart.data],
        };
      });
    }

    if (streamPart.type === 'data-textDelta') {
      setArtifact((draftArtifact) => {
        return {
          ...draftArtifact,
          content: draftArtifact.content + streamPart.data,
          isVisible:
            draftArtifact.status === 'streaming' &&
            draftArtifact.content.length > 400 &&
            draftArtifact.content.length < 450
              ? true
              : draftArtifact.isVisible,
          status: 'streaming',
        };
      });
    }
  },
  content: ({
    mode,
    status,
    content,
    isCurrentVersion,
    currentVersionIndex,
    onSaveContent,
    getDocumentContentById,
    isLoading,
    metadata,
  }) => {
    if (isLoading) {
      return <DocumentSkeleton />;
    }

    if (mode === 'diff') {
      const oldContent = getDocumentContentById(currentVersionIndex - 1);
      const newContent = getDocumentContentById(currentVersionIndex);

      return <DiffView oldContent={oldContent} newContent={newContent} />;
    }

    return (
      <>
        <div className="flex flex-row py-8 md:p-20 px-4">
          <Editor
            content={content}
            suggestions={metadata ? metadata.suggestions : []}
            isCurrentVersion={isCurrentVersion}
            currentVersionIndex={currentVersionIndex}
            status={status}
            onSaveContent={onSaveContent}
          />

          {metadata?.suggestions && metadata.suggestions.length > 0 ? (
            <div className="md:hidden h-dvh w-12 shrink-0" />
          ) : null}
        </div>
      </>
    );
  },
  actions: [
    {
      icon: <ClockRewind size={18} />,
      description: 'View changes',
      onClick: ({ handleVersionChange }) => {
        handleVersionChange('toggle');
      },
      isDisabled: ({ currentVersionIndex }) => {
        return currentVersionIndex === 0;
      },
    },
    {
      icon: <UndoIcon size={18} />,
      description: 'View Previous version',
      onClick: ({ handleVersionChange }) => {
        handleVersionChange('prev');
      },
      isDisabled: ({ currentVersionIndex }) => {
        return currentVersionIndex === 0;
      },
    },
    {
      icon: <RedoIcon size={18} />,
      description: 'View Next version',
      onClick: ({ handleVersionChange }) => {
        handleVersionChange('next');
      },
      isDisabled: ({ isCurrentVersion }) => {
        return isCurrentVersion;
      },
    },
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
      description: 'Download as PDF',
      onClick: async ({ content }) => {
        try {
          
          const styles = StyleSheet.create({
            page: {
              flexDirection: 'column',
              backgroundColor: '#ffffff',
              padding: 30,
            },
            h1: {
              fontSize: 20,
              marginBottom: 10,
              marginTop: 5,
              fontFamily: 'Helvetica-Bold',
            },
            h2: {
              fontSize: 16,
              marginBottom: 8,
              marginTop: 15,
              fontFamily: 'Helvetica-Bold',
            },
            h3: {
              fontSize: 14,
              marginBottom: 6,
              marginTop: 12,
              fontFamily: 'Helvetica-Bold',
            },
            text: {
              fontSize: 12,
              lineHeight: 1.5,
              fontFamily: 'Helvetica',
              marginBottom: 6,
            },
            strong: {
              fontSize: 12,
              lineHeight: 1.5,
              fontFamily: 'Helvetica-Bold',
              marginBottom: 6,
            },
          });

          // Simple markdown parsing - convert to PDF elements
          const lines = content.split('\n');
          const elements: any[] = [];
          
          lines.forEach((line, index) => {
            if (line.startsWith('# ')) {
              elements.push(
                React.createElement(Text, { 
                  key: `h1-${index}`, 
                  style: styles.h1 
                }, line.substring(2))
              );
            } else if (line.startsWith('## ')) {
              elements.push(
                React.createElement(Text, { 
                  key: `h2-${index}`, 
                  style: styles.h2 
                }, line.substring(3))
              );
            } else if (line.startsWith('### ')) {
              elements.push(
                React.createElement(Text, { 
                  key: `h3-${index}`, 
                  style: styles.h3 
                }, line.substring(4))
              );
            } else if (line.trim() !== '') {
              // Check for bold text **text**
              if (line.includes('**')) {
                elements.push(
                  React.createElement(Text, { 
                    key: `text-${index}`, 
                    style: styles.strong 
                  }, line.replace(/\*\*(.*?)\*\*/g, '$1'))
                );
              } else {
                elements.push(
                  React.createElement(Text, { 
                    key: `text-${index}`, 
                    style: styles.text 
                  }, line)
                );
              }
            }
          });

          const MyDocument = () => React.createElement(
            Document,
            {},
            React.createElement(
              Page,
              { style: styles.page },
              ...elements
            )
          );

          const blob = await pdf(React.createElement(MyDocument)).toBlob();
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'document.pdf';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          toast.success('PDF downloaded!');
        } catch (error) {
          console.error('PDF generation error:', error);
          toast.error('Failed to generate PDF. Please try again.');
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
              documentId: crypto.randomUUID(), // Generate a unique ID for the report
              content,
              priority: 'medium',
            }),
          });

          const result = await response.json();

          if (response.ok) {
            toast.success('Conflict report submitted for review successfully!');
          } else {
            toast.error(result.error || 'Failed to submit report for review');
          }
        } catch (error) {
          console.error('Submit for review error:', error);
          toast.error('Failed to submit report for review. Please try again.');
        }
      },
      isDisabled: ({ isCurrentVersion }) => {
        return !isCurrentVersion;
      },
    },
  ],
  toolbar: [
    {
      icon: <PenIcon />,
      description: 'Add final polish',
      onClick: ({ sendMessage }) => {
        sendMessage({
          role: 'user',
          parts: [
            {
              type: 'text',
              text: 'Please add final polish and check for grammar, add section titles for better structure, and ensure everything reads smoothly.',
            },
          ],
        });
      },
    },
    {
      icon: <MessageIcon />,
      description: 'Request suggestions',
      onClick: ({ sendMessage }) => {
        sendMessage({
          role: 'user',
          parts: [
            {
              type: 'text',
              text: 'Please add suggestions you have that could improve the writing.',
            },
          ],
        });
      },
    },
  ],
});
