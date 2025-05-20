'use client';

import { useChat } from '@ai-sdk/react';
import { useEffect, useMemo, useRef } from 'react';
import { artifactDefinitions } from './artifact';
import { initialArtifactData, useArtifact } from '@/hooks/use-artifact';
import { useChatStore } from './chat-store';

export function DataStreamHandler({ id }: { id: string }) {
  const chatStore = useChatStore();
  const { messages } = useChat({ chatId: id, chatStore });
  const { artifact, setArtifact, setMetadata } = useArtifact();

  const lastProcessedIndex = useRef(-1);

  const dataStream = useMemo(() => {
    const mostRecentMessage = messages.at(-1);

    const dataParts = mostRecentMessage
      ? mostRecentMessage.parts.filter((part) => part.type.startsWith('data-'))
      : [];

    return dataParts;
  }, [messages]);

  useEffect(() => {
    if (!dataStream?.length) return;

    const newDeltas = dataStream.slice(lastProcessedIndex.current + 1);
    lastProcessedIndex.current = dataStream.length - 1;

    newDeltas.forEach((delta) => {
      const artifactDefinition = artifactDefinitions.find(
        (artifactDefinition) => artifactDefinition.kind === artifact.kind,
      );

      if (artifactDefinition?.onStreamPart) {
        artifactDefinition.onStreamPart({
          streamPart: delta,
          setArtifact,
          setMetadata,
        });
      }

      setArtifact((draftArtifact) => {
        if (!draftArtifact) {
          return { ...initialArtifactData, status: 'streaming' };
        }

        switch (delta.type) {
          case 'data-artifacts-id':
            return {
              ...draftArtifact,
              documentId: delta.data,
              status: 'streaming',
            };

          case 'data-artifacts-title':
            return {
              ...draftArtifact,
              title: delta.data,
              status: 'streaming',
            };

          case 'data-artifacts-suggestion':
            return {
              ...draftArtifact,
              kind: delta.data,
              status: 'streaming',
            };

          case 'data-artifacts-clear':
            return {
              ...draftArtifact,
              content: '',
              status: 'streaming',
            };

          case 'data-artifacts-finish':
            return {
              ...draftArtifact,
              status: 'idle',
            };

          default:
            return draftArtifact;
        }
      });
    });
  }, [dataStream, setArtifact, setMetadata, artifact]);

  return null;
}
