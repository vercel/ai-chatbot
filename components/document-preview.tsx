'use client';

import { useRef } from 'react';
import { useArtifact } from '@/hooks/use-artifact';
import { DocumentHeader } from './document-header';
import { DocumentContent } from './document-content';
import { DocumentHitbox } from './document-hitbox';
import type { Document } from '@/lib/types';
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
        isStreaming={document.status === 'in_progress'}
      />
      <DocumentContent document={document} />
    </div>
  );
}
