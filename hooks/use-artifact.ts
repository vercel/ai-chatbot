'use client';

import useSWR, { unstable_serialize } from 'swr';
import { UIArtifact } from '@/components/artifact';
import { useCallback, useMemo, useRef, useEffect } from 'react';

export const initialArtifactData: UIArtifact = {
  documentId: 'init',
  content: '',
  kind: 'text',
  title: '',
  status: 'idle',
  isVisible: false,
  boundingBox: {
    top: 0,
    left: 0,
    width: 0,
    height: 0,
  },
};

type Selector<T> = (state: UIArtifact) => T;

export function useArtifactSelector<Selected>(selector: Selector<Selected>) {
  const { data: localArtifact } = useSWR<UIArtifact>('artifact', null, {
    fallbackData: initialArtifactData,
  });

  const selectedValue = useMemo(() => {
    if (!localArtifact) return selector(initialArtifactData);
    return selector(localArtifact);
  }, [localArtifact, selector]);

  return selectedValue;
}

export function useArtifact() {
  // Use stable cache keys
  const ARTIFACT_CACHE_KEY = 'artifact';
  
  // Optimize SWR config to reduce unnecessary revalidations
  const { data: localArtifact, mutate: setLocalArtifact } = useSWR<UIArtifact>(
    ARTIFACT_CACHE_KEY,
    null,
    {
      fallbackData: initialArtifactData,
      revalidateIfStale: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    },
  );

  // Optimize memoization with reference equality check
  const previousArtifact = useRef<UIArtifact | null>(null);
  const artifact = useMemo(() => {
    const currentArtifact = localArtifact || initialArtifactData;
    if (previousArtifact.current === currentArtifact) {
      return previousArtifact.current;
    }
    previousArtifact.current = currentArtifact;
    return currentArtifact;
  }, [localArtifact]);

  // Memoize the setter function once
  const setArtifact = useCallback(
    (updaterFn: UIArtifact | ((currentArtifact: UIArtifact) => UIArtifact)) => {
      setLocalArtifact((currentArtifact) => {
        const artifactToUpdate = currentArtifact || initialArtifactData;

        if (typeof updaterFn === 'function') {
          return updaterFn(artifactToUpdate);
        }

        return updaterFn;
      }, { revalidate: false }); // Disable automatic revalidation
    },
    [setLocalArtifact],
  );

  // Use dependent query with stable key generation
  const metadataKey = artifact.documentId ? 
    unstable_serialize(['artifact-metadata', artifact.documentId]) : null;
    
  const { data: localArtifactMetadata, mutate: setLocalArtifactMetadata } =
    useSWR<any>(
      metadataKey,
      null,
      {
        fallbackData: null,
        revalidateIfStale: false,
        revalidateOnFocus: false,
      },
    );
    
  // Clean up stale metadata when documentId changes
  useEffect(() => {
    return () => {
      // Cleanup function to prevent memory leaks
      if (artifact.documentId && artifact.documentId !== 'init') {
        // This helps prevent memory leaks by cleaning up old metadata
        setLocalArtifactMetadata(null, { revalidate: false });
      }
    };
  }, [artifact.documentId, setLocalArtifactMetadata]);

  return useMemo(
    () => ({
      artifact,
      setArtifact,
      metadata: localArtifactMetadata,
      setMetadata: setLocalArtifactMetadata,
    }),
    [artifact, setArtifact, localArtifactMetadata, setLocalArtifactMetadata],
  );
}
