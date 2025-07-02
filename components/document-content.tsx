import { Editor } from './text-editor';
import { CodeEditor } from './code-editor';
import { SpreadsheetEditor } from './sheet-editor';
import { ImageEditor } from './image-editor';
import cn from 'classnames';
import type { Document } from '@/lib/types';

export const DocumentContent = ({
  document,
}: { document: Partial<Document> }) => {
  const containerClassName = cn(
    'h-[257px] overflow-y-scroll border rounded-b-2xl dark:bg-muted border-t-0 dark:border-zinc-700',
    {
      'p-4 sm:px-14 sm:py-16': document.kind === 'text',
      'p-0': document.kind === 'code',
    },
  );

  const commonProps = {
    content: document.content ?? '',
    isCurrentVersion: true,
    currentVersionIndex: 0,
    status: document.status ?? 'in_progress',
    saveContent: () => {},
    suggestions: [],
  };

  return (
    <div className={containerClassName}>
      {document.kind === 'text' ? (
        <Editor {...commonProps} onSaveContent={() => {}} />
      ) : document.kind === 'code' ? (
        <div className="flex flex-1 relative w-full">
          <div className="absolute inset-0">
            <CodeEditor {...commonProps} onSaveContent={() => {}} />
          </div>
        </div>
      ) : document.kind === 'sheet' ? (
        <div className="flex flex-1 relative size-full p-4">
          <div className="absolute inset-0">
            <SpreadsheetEditor {...commonProps} />
          </div>
        </div>
      ) : document.kind === 'image' ? (
        <ImageEditor
          title={document.title ?? 'Untitled'}
          content={document.content ?? ''}
          isCurrentVersion={true}
          currentVersionIndex={0}
          status={document.status ?? 'in_progress'}
          isInline={true}
        />
      ) : null}
    </div>
  );
};
