import { memo, type MouseEvent, type RefObject, useCallback } from 'react';
import { FullscreenIcon } from './icons';
import equal from 'fast-deep-equal';
import type { Document } from '@/lib/types';
import { useDocumentLayout } from '@/hooks/use-document-layout';

const PureDocumentHitbox = ({
  hitboxRef,
  document,
}: {
  hitboxRef: RefObject<HTMLDivElement>;
  document: Partial<Document>;
}) => {
  const { setDocumentLayout } = useDocumentLayout();

  const handleClick = useCallback(
    (event: MouseEvent<HTMLDivElement>) => {
      const boundingBox = event.currentTarget.getBoundingClientRect();

      setDocumentLayout((documentLayout) => ({
        ...documentLayout,
        selectedDocumentId: document.id,
        isVisible: true,
        boundingBox: {
          left: boundingBox.x,
          top: boundingBox.y,
          width: boundingBox.width,
          height: boundingBox.height,
        },
      }));
    },
    [setDocumentLayout, document],
  );

  return (
    <div
      className="size-full absolute top-0 left-0 rounded-xl z-10"
      ref={hitboxRef}
      onClick={handleClick}
      role="presentation"
      aria-hidden="true"
    >
      <div className="w-full p-4 flex justify-end items-center">
        <div className="absolute right-[9px] top-[13px] p-2 hover:dark:bg-zinc-700 rounded-md hover:bg-zinc-100">
          <FullscreenIcon />
        </div>
      </div>
    </div>
  );
};

export const DocumentHitbox = memo(
  PureDocumentHitbox,
  (prevProps, nextProps) => {
    if (!equal(prevProps.document, nextProps.document)) return false;
    return true;
  },
);
