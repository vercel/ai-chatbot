/**
 * @file hooks/use-artifact.ts
 * @description Хук для управления глобальным состоянием артефакта.
 * @version 1.2.0
 * @date 2025-06-06
 * @updated Добавлено поле saveStatus для отслеживания состояния сохранения артефакта.
 */

/** HISTORY:
 * v1.2.0 (2025-06-06): Добавлено поле `saveStatus` ('idle' | 'saving' | 'saved').
 * v1.1.0 (2025-06-05): Добавлены 'displayMode' и 'toggleDisplayMode' для управления режимами отображения.
 * v1.0.0 (2025-05-25): Начальная версия хука.
 */

'use client';

import useSWR from 'swr';
import type { UIArtifact, } from '@/components/artifact';
import { useCallback, useMemo } from 'react';

export const initialArtifactData: UIArtifact = {
  documentId: 'init',
  content: '',
  kind: 'text',
  title: '',
  status: 'idle',
  saveStatus: 'saved', // Начальное состояние - "сохранено"
  isVisible: false,
  displayMode: 'split',
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
  const { data: localArtifact, mutate: setLocalArtifact } = useSWR<UIArtifact>(
    'artifact',
    null,
    {
      fallbackData: initialArtifactData,
    },
  );

  const artifact = useMemo(() => {
    if (!localArtifact) return initialArtifactData;
    return localArtifact;
  }, [localArtifact]);

  const setArtifact = useCallback(
    (updaterFn: UIArtifact | ((currentArtifact: UIArtifact) => UIArtifact)) => {
      setLocalArtifact((currentArtifact) => {
        const artifactToUpdate = currentArtifact || initialArtifactData;

        if (typeof updaterFn === 'function') {
          return updaterFn(artifactToUpdate);
        }

        return updaterFn;
      });
    },
    [setLocalArtifact],
  );

  const toggleDisplayMode = useCallback(() => {
    setArtifact((current) => ({
      ...current,
      displayMode: current.displayMode === 'split' ? 'full' : 'split',
    }));
  }, [setArtifact]);

  const { data: localArtifactMetadata, mutate: setLocalArtifactMetadata } =
    useSWR<any>(
      () =>
        artifact.documentId ? `artifact-metadata-${artifact.documentId}` : null,
      null,
      {
        fallbackData: null,
      },
    );

  return useMemo(
    () => ({
      artifact,
      setArtifact,
      toggleDisplayMode,
      metadata: localArtifactMetadata,
      setMetadata: setLocalArtifactMetadata,
    }),
    [
      artifact,
      setArtifact,
      toggleDisplayMode,
      localArtifactMetadata,
      setLocalArtifactMetadata,
    ],
  );
}

// END OF: hooks/use-artifact.ts
