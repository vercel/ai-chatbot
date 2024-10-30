import { JSONValue } from 'ai';
import { Dispatch, memo, SetStateAction } from 'react';

import { UICanvas } from './canvas';
import { useCanvasStream } from './use-canvas-stream';

interface CanvasStreamHandlerProps {
  setCanvas: Dispatch<SetStateAction<UICanvas | null>>;
  streamingData: JSONValue[] | undefined;
}

export function PureCanvasStreamHandler({
  setCanvas,
  streamingData,
}: CanvasStreamHandlerProps) {
  useCanvasStream({
    streamingData,
    setCanvas,
  });

  return null;
}

function areEqual(
  prevProps: CanvasStreamHandlerProps,
  nextProps: CanvasStreamHandlerProps
) {
  if (!prevProps.streamingData && !nextProps.streamingData) {
    return true;
  }

  if (!prevProps.streamingData || !nextProps.streamingData) {
    return false;
  }

  if (prevProps.streamingData.length !== nextProps.streamingData.length) {
    return false;
  }

  return true;
}

export const CanvasStreamHandler = memo(PureCanvasStreamHandler, areEqual);
