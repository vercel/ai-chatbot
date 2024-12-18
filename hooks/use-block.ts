'use client';

import { UIBlock } from '@/components/block';
import { useCallback, useMemo } from 'react';
import useSWR from 'swr';

export const initialBlockData: UIBlock = {
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

// Add type for selector function
type Selector<T> = (state: UIBlock) => T;

export function useBlockSelector<Selected>(selector: Selector<Selected>) {
  const { data: localBlock } = useSWR<UIBlock>('block', null, {
    fallbackData: initialBlockData,
  });

  const selectedValue = useMemo(() => {
    if (!localBlock) return selector(initialBlockData);
    return selector(localBlock);
  }, [localBlock, selector]);

  return selectedValue;
}

export function useBlock() {
  const { data: localBlock, mutate: setLocalBlock } = useSWR<UIBlock>(
    'block',
    null,
    {
      fallbackData: initialBlockData,
    },
  );

  const block = useMemo(() => {
    if (!localBlock) return initialBlockData;
    return localBlock;
  }, [localBlock]);

  const setBlock = useCallback(
    (updaterFn: UIBlock | ((currentBlock: UIBlock) => UIBlock)) => {
      setLocalBlock((currentBlock) => {
        const blockToUpdate = currentBlock || initialBlockData;

        if (typeof updaterFn === 'function') {
          return updaterFn(blockToUpdate);
        }

        return updaterFn;
      });
    },
    [setLocalBlock],
  );

  return useMemo(() => ({ block, setBlock }), [block, setBlock]);
}
