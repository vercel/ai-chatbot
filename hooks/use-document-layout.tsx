import type { DocumentLayout } from '@/lib/types';
import useSWR from 'swr';

const initialDocumentLayout: DocumentLayout = {
  selectedDocumentId: null,
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
      const fallbackLayout: DocumentLayout = {
        selectedDocumentId: null,
        isVisible: false,
        boundingBox: {
          top: 0,
          left: 0,
          width: 0,
          height: 0,
        },
      };

      if (!prev) {
        return {
          ...fallbackLayout,
          ...(typeof updater === 'function'
            ? updater(fallbackLayout)
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
