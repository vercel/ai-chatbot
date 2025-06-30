import type { DocumentLayout } from '@/lib/types';
import useSWR from 'swr';

const initialDocumentLayout: DocumentLayout = {
  isVisible: false,
  boundingBox: {
    top: 0,
    left: 0,
    width: 0,
    height: 0,
  },
};

export const useDocumentLayout = () => {
  const { data: documentLayout, mutate: setDocumentLayout } =
    useSWR<DocumentLayout>('document-layout', null, {
      fallbackData: initialDocumentLayout,
    });

  const updateDocumentLayout = (
    updater:
      | Partial<DocumentLayout>
      | ((prev: DocumentLayout) => Partial<DocumentLayout>),
  ) => {
    setDocumentLayout((prev) => {
      if (!prev) {
        return {
          isVisible: false,
          boundingBox: {
            top: 0,
            left: 0,
            width: 0,
            height: 0,
          },
          ...(typeof updater === 'function'
            ? updater({
                isVisible: false,
                boundingBox: {
                  top: 0,
                  left: 0,
                  width: 0,
                  height: 0,
                },
              })
            : updater),
        };
      }

      return {
        ...prev,
        ...(typeof updater === 'function' ? updater(prev) : updater),
      };
    });
  };

  return {
    documentLayout: documentLayout ?? initialDocumentLayout,
    setDocumentLayout: updateDocumentLayout,
  };
};
