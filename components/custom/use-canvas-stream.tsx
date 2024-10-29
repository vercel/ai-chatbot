import { JSONValue } from 'ai';
import { Dispatch, SetStateAction, useEffect, useCallback } from 'react';
import { useSWRConfig } from 'swr';

import { UICanvas } from './canvas';

type StreamingDelta = {
  type: 'text-delta' | 'title' | 'id' | 'suggestions' | 'clear' | 'finish';
  content: string;
};

export function useCanvasStream({
  streamingData,
  setCanvas,
}: {
  streamingData: JSONValue[] | undefined;
  setCanvas: Dispatch<SetStateAction<UICanvas | null>>;
}) {
  const { mutate } = useSWRConfig();

  const fetchSuggestions = useCallback(
    async (documentId: string) => {
      const url = `/api/suggestions?documentId=${documentId}`;
      mutate(url, await fetch(url).then((res) => res.json()));
    },
    [mutate]
  );

  useEffect(() => {
    const mostRecentDelta = streamingData?.at(-1);
    if (!mostRecentDelta) return;

    const delta = mostRecentDelta as StreamingDelta;

    setCanvas((draftCanvas) => {
      if (!draftCanvas) {
        return {
          content: '',
          title: '',
          isVisible: false,
          documentId: delta.type === 'id' ? delta.content : '',
          status: 'idle',
          boundingBox: {
            top: 0,
            left: 0,
            width: 0,
            height: 0,
          },
        };
      }

      switch (delta.type) {
        case 'text-delta':
          return {
            ...draftCanvas,
            content: draftCanvas.content + delta.content,
            isVisible:
              draftCanvas.status === 'streaming'
                ? true
                : draftCanvas.content.length > 200,
            status: 'streaming',
          };

        case 'title':
          return {
            ...draftCanvas,
            title: delta.content,
          };

        case 'suggestions':
          if (draftCanvas.documentId) {
            void fetchSuggestions(draftCanvas.documentId);
          }

          return draftCanvas;

        case 'clear':
          return {
            ...draftCanvas,
            content: '',
            status: 'streaming',
          };

        case 'finish':
          return {
            ...draftCanvas,
            status: 'idle',
          };

        default:
          return draftCanvas;
      }
    });
  }, [streamingData, setCanvas, fetchSuggestions]);
}
