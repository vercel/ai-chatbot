'use client';

import { useMemo, useRef } from 'react';
import { FullscreenIcon } from './icons';
import { fetcher } from '@/lib/utils';
import type { Tables } from '@/lib/db/schema';
import { InlineDocumentSkeleton } from './document-skeleton';
import useSWR from 'swr';
import { useArtifact } from '@/hooks/use-artifact';
import { DocumentHeader } from './document-header';
import { DocumentContent } from './document-content';
import { DocumentHitbox } from './document-hitbox';
import type { Document, DocumentKind } from '@/lib/types';
import { useDocumentLayout } from '@/hooks/use-document-layout';

interface DocumentPreviewProps {
  args?: any;
  document: Partial<Document>;
  isReadonly: boolean;
}

export function DocumentPreview({
  args,
  document,
  isReadonly,
}: DocumentPreviewProps) {
  const { setArtifact } = useArtifact();
  const { documentLayout, setDocumentLayout } = useDocumentLayout();

  const { data: documents, isLoading: isDocumentsFetching } = useSWR<
    Tables<'Document'>[]
  >(document ? `/api/document?id=${document.id}` : null, fetcher);

  const previewDocument = useMemo(() => documents?.[0], [documents]);
  const hitboxRef = useRef<HTMLDivElement>(null);

  // useEffect(() => {
  //   const boundingBox = hitboxRef.current?.getBoundingClientRect();

  //   if (document.id && boundingBox) {
  //     setDocumentLayout((documentLayout) => ({
  //       ...documentLayout,
  //       boundingBox: {
  //         left: boundingBox.x,
  //         top: boundingBox.y,
  //         width: boundingBox.width,
  //         height: boundingBox.height,
  //       },
  //     }));
  //   }
  // }, [document]);

  if (documentLayout?.isVisible) {
    return <div>Document Tool Result</div>;
  }

  // if (args) {
  //   return (
  //     <DocumentToolCall
  //       type="create"
  //       args={{ title: args.title }}
  //       isReadonly={isReadonly}
  //     />
  //   );
  // }

  // if (isDocumentsFetching) {
  //   return <LoadingSkeleton artifactKind={artifact.kind ?? args.kind} />;
  // }

  // const document: Document | null = previewDocument
  //   ? previewDocument
  //   : artifact.status === 'streaming'
  //     ? {
  //         title: artifact.title,
  //         kind: artifact.kind,
  //         content: artifact.content,
  //         id: artifact.documentId,
  //         createdAt: new Date(),
  //         userId: 'noop',
  //       }
  //     : null;

  // if (!document) return <LoadingSkeleton documentKind={document.kind} />;

  return (
    <div className="relative w-full cursor-pointer">
      <DocumentHitbox hitboxRef={hitboxRef} document={document} />
      <DocumentHeader
        title={document.title ?? 'Untitled'}
        kind={document.kind ?? 'text'}
        // isStreaming={artifact.status === 'streaming'}
        isStreaming={false}
      />
      <DocumentContent document={document} />
    </div>
  );
}

const LoadingSkeleton = ({ documentKind }: { documentKind: DocumentKind }) => (
  <div className="w-full">
    <div className="p-4 border rounded-t-2xl flex flex-row gap-2 items-center justify-between dark:bg-muted h-[57px] dark:border-zinc-700 border-b-0">
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

    {documentKind === 'image' ? (
      <div className="overflow-y-scroll border rounded-b-2xl bg-muted border-t-0 dark:border-zinc-700">
        <div className="animate-pulse h-[257px] bg-muted-foreground/20 w-full" />
      </div>
    ) : (
      <div className="overflow-y-scroll border rounded-b-2xl p-8 pt-4 bg-muted border-t-0 dark:border-zinc-700">
        <InlineDocumentSkeleton />
      </div>
    )}
  </div>
);
