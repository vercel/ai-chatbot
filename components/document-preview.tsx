'use client';

import { SetStateAction, useEffect, useMemo, useRef, useState } from 'react';
import { UIBlock } from './block';
import { FileIcon, FullscreenIcon } from './icons';
import { fetcher } from '@/lib/utils';
import { Markdown } from './markdown';
import { Document } from '@/lib/db/schema';
import { InlineDocumentSkeleton } from './document-skeleton';
import { motion } from 'framer-motion';
import useSWR from 'swr';
import { Editor } from './editor';
import { DocumentToolCall, DocumentToolResult } from './document';

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

  const previewDocument = useMemo(() => {
    if (!documents) return null;
    const [document] = documents;
    return document;
  }, [documents]);

  const hitboxRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    console.log('document id change');
    const boundingBox = hitboxRef.current?.getBoundingClientRect();
    console.log(boundingBox);

    if (block.documentId && boundingBox) {
      console.log('set bb');
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
    } else if (args) {
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

  return isDocumentsFetching ? (
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
  ) : previewDocument ? (
    <div className="relative w-full cursor-pointer">
      <div
        className="size-full absolute top-0 left-0 rounded-xl z-10"
        ref={hitboxRef}
        onClick={(event) => {
          const boundingBox = event.currentTarget.getBoundingClientRect();

          setBlock((block) => ({
            ...block,
            documentId: result.id,
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

      <div className="p-4 border rounded-t-2xl flex flex-row gap-2 items-center justify-between dark:bg-muted border-b-0 dark:border-zinc-700">
        <div className="flex flex-row items-center gap-3">
          <div className="text-muted-foreground">
            <FileIcon />
          </div>
          <div>{result.title}</div>
        </div>
        <div onClick={() => {}}>
          <FullscreenIcon />
        </div>
      </div>

      <div className="h-[257px] overflow-y-scroll border rounded-b-2xl px-14 py-16 dark:bg-muted border-t-0 dark:border-zinc-700">
        {previewDocument.kind === 'text' ? (
          <Editor
            content={previewDocument.content ?? ''}
            isCurrentVersion={true}
            currentVersionIndex={0}
            status={block.status}
            saveContent={() => {}}
            suggestions={[]}
          />
        ) : previewDocument.kind === 'code' ? (
          <pre>{block.content}</pre>
        ) : null}
      </div>
    </div>
  ) : block.status === 'streaming' ? (
    <div className="relative w-full cursor-pointer">
      <div
        className="size-full absolute top-0 left-0 rounded-xl z-10"
        ref={hitboxRef}
        onClick={(event) => {
          const boundingBox = event.currentTarget.getBoundingClientRect();

          setBlock((block) => ({
            ...block,
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

      <div className="p-4 border rounded-t-2xl flex flex-row gap-2 items-center justify-between bg-muted border-b-0 dark:border-zinc-700">
        <div className="flex flex-row items-center gap-3">
          <div className="text-muted-foreground">
            <FileIcon />
          </div>
          <div>{block.title}</div>
        </div>
        <div onClick={() => {}}>
          <FullscreenIcon />
        </div>
      </div>

      <div className="h-[257px] overflow-y-scroll border rounded-b-2xl p-8 bg-muted border-t-0 dark:border-zinc-700">
        {block.kind === 'text' ? (
          <Editor
            content={block.content}
            isCurrentVersion={true}
            currentVersionIndex={0}
            status={block.status}
            saveContent={() => {}}
            suggestions={[]}
          />
        ) : block.kind === 'code' ? (
          <pre>{block.content}</pre>
        ) : null}
      </div>
    </div>
  ) : null;
}
