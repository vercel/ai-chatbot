'use client';

import { SetStateAction, useEffect, useMemo, useRef } from 'react';
import { UIBlock } from './block';
import { FileIcon, FullscreenIcon } from './icons';
import { cn, fetcher } from '@/lib/utils';
import { Document } from '@/lib/db/schema';
import { InlineDocumentSkeleton } from './document-skeleton';
import useSWR from 'swr';
import { Editor } from './editor';
import { DocumentToolCall, DocumentToolResult } from './document';
import { CodeEditor } from './code-editor';

interface DocumentPreviewProps {
  block: UIBlock;
  setBlock: (value: SetStateAction<UIBlock>) => void;
  isReadonly: boolean;
  result?: any;
  args?: any;
}

export function DocumentPreview({
  block,
  setBlock,
  isReadonly,
  result,
  args,
}: DocumentPreviewProps) {
  const {
    data: documents,
    isLoading: isDocumentsFetching,
    mutate: mutateDocuments,
  } = useSWR<Array<Document>>(
    block && block.status !== 'streaming' && (args || result)
      ? `/api/document?id=${args ? args.id : result.id}`
      : null,
    fetcher,
  );

  const previewDocument = useMemo(() => documents?.[0], [documents]);
  const hitboxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const boundingBox = hitboxRef.current?.getBoundingClientRect();
    if (block.documentId && boundingBox) {
      setBlock((block) => ({
        ...block,
        boundingBox: {
          left: boundingBox.x,
          top: boundingBox.y,
          width: boundingBox.width,
          height: boundingBox.height,
        },
      }));
    }
  }, [block.documentId, setBlock]);

  if (block.isVisible) {
    if (result) {
      return (
        <DocumentToolResult
          type="create"
          result={{ id: result.id, title: result.title, kind: result.kind }}
          block={block}
          setBlock={setBlock}
          isReadonly={isReadonly}
        />
      );
    }

    if (args) {
      return (
        <DocumentToolCall
          type="create"
          args={{ title: args.title }}
          setBlock={setBlock}
          isReadonly={isReadonly}
        />
      );
    }
  }

  if (isDocumentsFetching) {
    return <LoadingSkeleton />;
  }

  const document =
    previewDocument || block.status === 'streaming'
      ? {
          title: previewDocument?.title || block.title,
          content: previewDocument?.content || block.content,
          kind: previewDocument?.kind || block.kind,
        }
      : null;

  if (!document) return null;

  return (
    <div className="relative w-full cursor-pointer">
      <HitboxLayer hitboxRef={hitboxRef} setBlock={setBlock} result={result} />
      <DocumentHeader title={document.title} />
      <DocumentContent document={document} block={block} />
    </div>
  );
}

const LoadingSkeleton = () => (
  <div className="w-full">
    <div className="p-4 border rounded-t-2xl flex flex-row gap-2 items-center justify-between dark:bg-muted h-[58px] dark:border-zinc-700 border-b-0">
      <div className="flex flex-row items-center gap-3">
        <div className="text-muted-foreground">
          <div className="animate-pulse rounded-md size-4 bg-muted-foreground/20" />
        </div>
        <div className="animate-pulse rounded-lg h-4 bg-muted-foreground/20 w-24" />
      </div>
      <div>
        <FullscreenIcon />
      </div>
    </div>
    <div className="overflow-y-scroll border rounded-b-2xl p-8 pt-4 bg-muted border-t-0 dark:border-zinc-700">
      <InlineDocumentSkeleton />
    </div>
  </div>
);

const HitboxLayer = ({
  hitboxRef,
  setBlock,
  result,
}: {
  hitboxRef: React.RefObject<HTMLDivElement>;
  setBlock: (value: SetStateAction<UIBlock>) => void;
  result: any;
}) => (
  <div
    className="size-full absolute top-0 left-0 rounded-xl z-10"
    ref={hitboxRef}
    onClick={(event) => {
      const boundingBox = event.currentTarget.getBoundingClientRect();
      setBlock((block) => ({
        ...block,
        documentId: result?.id,
        kind: result?.kind,
        isVisible: true,
        boundingBox: {
          left: boundingBox.x,
          top: boundingBox.y,
          width: boundingBox.width,
          height: boundingBox.height,
        },
      }));
    }}
  />
);

const DocumentHeader = ({ title }: { title: string }) => (
  <div className="p-4 border rounded-t-2xl flex flex-row gap-2 items-center justify-between dark:bg-muted border-b-0 dark:border-zinc-700">
    <div className="flex flex-row items-center gap-3">
      <div className="text-muted-foreground">
        <FileIcon />
      </div>
      <div>{title}</div>
    </div>
    <div>
      <FullscreenIcon />
    </div>
  </div>
);

const DocumentContent = ({
  document,
  block,
}: {
  document: Document;
  block: UIBlock;
}) => {
  const isTextDocument = document.kind === 'text';
  const containerClassName = cn(
    'h-[257px] overflow-y-scroll border rounded-b-2xl dark:bg-muted border-t-0 dark:border-zinc-700',
    {
      'px-14 py-16': isTextDocument,
      'p-0': !isTextDocument,
    },
  );

  const commonProps = {
    content: document.content ?? '',
    isCurrentVersion: true,
    currentVersionIndex: 0,
    status: block.status,
    saveContent: () => {},
    suggestions: [],
  };

  return (
    <div className={containerClassName}>
      {isTextDocument ? (
        <Editor {...commonProps} />
      ) : document.kind === 'code' ? (
        <CodeEditor {...commonProps} />
      ) : null}
    </div>
  );
};
