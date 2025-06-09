/**
 * @file hooks/use-artifact.ts
 * @description Хук для управления глобальным состоянием артефакта.
 * @version 2.1.0
 * @date 2025-06-09
 * @updated Исправлена ошибка в SWR key.
 */

/** HISTORY:
 * v2.1.0 (2025-06-09): Исправлена ошибка в SWR key.
 * v2.0.0 (2025-06-09): Рефакторинг documentId -> artifactId.
 */

'use client'

import useSWR from 'swr'
import type { UIArtifact, } from '@/components/artifact'
import { useCallback, useMemo } from 'react'

export const initialArtifactData: UIArtifact = {
  artifactId: null,
  content: '',
  kind: 'text',
  title: '',
  status: 'idle',
  saveStatus: 'saved',
  isVisible: false,
  displayMode: 'split',
  boundingBox: {
    top: 0,
    left: 0,
    width: 0,
    height: 0,
  },
}

type Selector<T> = (state: UIArtifact) => T;

export function useArtifactSelector<Selected> (selector: Selector<Selected>) {
  const { data: localArtifact } = useSWR<UIArtifact>('artifact', null, {
    fallbackData: initialArtifactData,
  })

  const selectedValue = useMemo(() => {
    if (!localArtifact) return selector(initialArtifactData)
    return selector(localArtifact)
  }, [localArtifact, selector])

  return selectedValue
}

export function useArtifact () {
  const { data: localArtifact, mutate: setLocalArtifact } = useSWR<UIArtifact>(
    'artifact',
    null,
    {
      fallbackData: initialArtifactData,
    },
  )

  const artifact = useMemo(() => {
    if (!localArtifact) return initialArtifactData
    return localArtifact
  }, [localArtifact])

  const setArtifact = useCallback(
    (updaterFn: UIArtifact | ((currentArtifact: UIArtifact) => UIArtifact)) => {
      setLocalArtifact((currentArtifact) => {
        const artifactToUpdate = currentArtifact || initialArtifactData
        if (typeof updaterFn === 'function') {
          return updaterFn(artifactToUpdate)
        }
        return updaterFn
      })
    },
    [setLocalArtifact],
  )

  const toggleDisplayMode = useCallback(() => {
    setArtifact((current) => ({
      ...current,
      displayMode: current.displayMode === 'split' ? 'full' : 'split',
    }))
  }, [setArtifact])

  const { data: localArtifactMetadata, mutate: setLocalArtifactMetadata } =
    useSWR<any>(
      () =>
        artifact.artifactId ? `artifact-metadata-${artifact.artifactId}` : null,
      null,
      {
        fallbackData: null,
      },
    )

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
  )
}

// END OF: hooks/use-artifact.ts
