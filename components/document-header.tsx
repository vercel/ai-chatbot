import { memo } from 'react';
import { FileIcon, ImageIcon, LoaderIcon } from './icons';
import type { DocumentKind } from '@/lib/types';

const PureDocumentHeader = ({
  title,
  kind,
  isStreaming,
}: {
  title: string;
  kind: DocumentKind;
  isStreaming: boolean;
}) => (
  <div className="p-4 border rounded-t-2xl flex flex-row gap-2 items-start sm:items-center justify-between dark:bg-muted border-b-0 dark:border-zinc-700">
    <div className="flex flex-row items-start sm:items-center gap-3">
      <div className="text-muted-foreground">
        {isStreaming ? (
          <div className="animate-spin">
            <LoaderIcon />
          </div>
        ) : kind === 'image' ? (
          <ImageIcon />
        ) : (
          <FileIcon />
        )}
      </div>
      <div className="-translate-y-1 sm:translate-y-0 font-medium">{title}</div>
    </div>
    <div className="w-8" />
  </div>
);

export const DocumentHeader = memo(
  PureDocumentHeader,
  (prevProps, nextProps) => {
    if (prevProps.title !== nextProps.title) return false;
    if (prevProps.isStreaming !== nextProps.isStreaming) return false;

    return true;
  },
);
