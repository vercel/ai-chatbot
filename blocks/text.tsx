import { Block } from '@/components/create-block';
import { DiffView } from '@/components/diffview';
import { DocumentSkeleton } from '@/components/document-skeleton';
import { Editor } from '@/components/editor';
import { ClockRewind, CopyIcon, RedoIcon, UndoIcon } from '@/components/icons';

export const textBlock = new Block({
  kind: 'text',
  description: 'Useful for text content, like drafting essays and emails.',
  content: ({
    mode,
    content,
    isCurrentVersion,
    currentVersionIndex,
    status,
    onSaveContent,
    suggestions,
    getDocumentContentById,
    isLoading,
  }) => {
    if (isLoading) {
      <DocumentSkeleton blockKind="text" />;
    }

    if (mode === 'diff') {
      const oldContent = getDocumentContentById(currentVersionIndex - 1);
      const newContent = getDocumentContentById(currentVersionIndex);

      return <DiffView oldContent={oldContent} newContent={newContent} />;
    }

    return (
      <Editor
        content={content}
        suggestions={suggestions}
        isCurrentVersion={isCurrentVersion}
        currentVersionIndex={currentVersionIndex}
        status={status}
        onSaveContent={onSaveContent}
      />
    );
  },
  actions: [
    {
      name: 'view changes',
      icon: <ClockRewind size={18} />,
      description: 'View changes',
      onClick: ({ handleVersionChange }) => {
        handleVersionChange('toggle');
      },
    },
    {
      name: 'view previous version',
      icon: <UndoIcon size={18} />,
      description: 'View Previous version',
      onClick: ({ handleVersionChange }) => {
        handleVersionChange('prev');
      },
    },
    {
      name: 'view next version',
      icon: <RedoIcon size={18} />,
      description: 'View Next version',
      onClick: ({ handleVersionChange }) => {
        handleVersionChange('next');
      },
    },
    {
      name: 'copy',
      icon: <CopyIcon size={18} />,
      description: 'Copy to clipboard',
      onClick: ({ content }) => {
        navigator.clipboard.writeText(content);
      },
    },
  ],
  toolbar: [
    {
      name: 'request-suggestions',
    },
    {
      name: 'adjust-reading-level',
    },
  ],
});
