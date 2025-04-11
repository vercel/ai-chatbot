'use client';

import { useCallback, useRef, useState } from 'react';

export function useActionState<State, Payload>(
  action: (payload: Payload) => Promise<State>,
  initialState: State,
): [State, (payload: Payload) => Promise<void>] {
  const [state, setState] = useState<State>(initialState);
  const actionRef = useRef(action);
  actionRef.current = action;

  const formAction = useCallback(
    async (payload: Payload) => {
      try {
        const result = await actionRef.current(payload);
        setState(result);
      } catch (error) {
        console.error('Action error:', error);
        setState({
          ...initialState,
          status: 'error',
          message: error instanceof Error ? error.message : 'An error occurred',
        } as State);
      }
    },
    [initialState],
  );

  return [state, formAction];
}
