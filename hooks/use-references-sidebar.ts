'use client';

import useSWR from 'swr';
import { useCallback, useMemo, useRef } from 'react';
import { KnowledgeReference } from '@/components/knowledge-references';

interface ReferencesSidebarState {
  isVisible: boolean;
  activeReferenceId: string | null;
  references: KnowledgeReference[];
  messageId: string | null;
  isCollapsed: boolean;
}

export const initialReferencesSidebarState: ReferencesSidebarState = {
  isVisible: false,
  activeReferenceId: null,
  references: [],
  messageId: null,
  isCollapsed: false
};

type Selector<T> = (state: ReferencesSidebarState) => T;

// Selector hook for getting specific parts of the sidebar state
export function useReferencesSidebarSelector<Selected>(selector: Selector<Selected>) {
  const { data: sidebarState } = useSWR<ReferencesSidebarState>('references-sidebar', null, {
    fallbackData: initialReferencesSidebarState,
  });

  const selectedValue = useMemo(() => {
    if (!sidebarState) return selector(initialReferencesSidebarState);
    return selector(sidebarState);
  }, [sidebarState, selector]);

  return selectedValue;
}

// Main hook for managing reference sidebar state
export function useReferencesSidebar() {
  const SIDEBAR_CACHE_KEY = 'references-sidebar';
  
  const { data: sidebarState, mutate: setSidebarState } = useSWR<ReferencesSidebarState>(
    SIDEBAR_CACHE_KEY,
    null,
    {
      fallbackData: initialReferencesSidebarState,
      revalidateIfStale: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    },
  );

  const previousState = useRef<ReferencesSidebarState | null>(null);
  const state = useMemo(() => {
    const currentState = sidebarState || initialReferencesSidebarState;
    if (previousState.current === currentState) {
      return previousState.current;
    }
    previousState.current = currentState;
    return currentState;
  }, [sidebarState]);

  const setState = useCallback(
    (updaterFn: ReferencesSidebarState | ((currentState: ReferencesSidebarState) => ReferencesSidebarState)) => {
      setSidebarState((currentState) => {
        const stateToUpdate = currentState || initialReferencesSidebarState;

        if (typeof updaterFn === 'function') {
          return updaterFn(stateToUpdate);
        }

        return updaterFn;
      }, { revalidate: false }); 
    },
    [setSidebarState],
  );

  // Utility functions for common operations
  const toggleSidebar = useCallback(() => {
    setState(current => ({
      ...current,
      isVisible: !current.isVisible
    }));
  }, [setState]);

  const setActiveReference = useCallback((referenceId: string | null) => {
    setState(current => ({
      ...current,
      activeReferenceId: referenceId,
      // Auto-show sidebar when a reference is activated
      isVisible: referenceId ? true : current.isVisible
    }));
  }, [setState]);

  const setReferences = useCallback((references: KnowledgeReference[], messageId: string) => {
    setState(current => ({
      ...current,
      references,
      messageId,
      // Auto-show sidebar when references are available and not empty
      isVisible: references.length > 0 ? true : current.isVisible
    }));
  }, [setState]);
  
  const toggleCollapse = useCallback(() => {
    setState(current => ({
      ...current,
      isCollapsed: !current.isCollapsed
    }));
  }, [setState]);

  return useMemo(
    () => ({
      state,
      setState,
      toggleSidebar,
      setActiveReference,
      setReferences,
      toggleCollapse
    }),
    [state, setState, toggleSidebar, setActiveReference, setReferences, toggleCollapse],
  );
}
