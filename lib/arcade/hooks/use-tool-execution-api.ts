import useSWRMutation from 'swr/mutation';
import type { ExecuteToolResult } from '@/lib/arcade/server';
import type { AuthorizationResponse } from '@arcadeai/arcadejs/resources/shared.mjs';

interface ExecuteToolParams {
  toolName: string;
  args: any;
}

interface checkAuthParams {
  toolName: string;
}

interface waitForAuthParams {
  authId: string;
}

export function useToolExecutionApi() {
  const executeTool = useSWRMutation<
    ExecuteToolResult,
    Error,
    '/api/tools',
    ExecuteToolParams
  >('/api/tools', async (url, { arg }: { arg: ExecuteToolParams }) => {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(arg),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to execute tool');
    }

    return response.json();
  });

  const checkAuth = useSWRMutation<
    AuthorizationResponse,
    Error,
    '/api/tools/auth',
    checkAuthParams
  >('/api/tools/auth', async (url, { arg }: { arg: checkAuthParams }) => {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(arg),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to complete authorization');
    }

    return response.json();
  });

  const waitForAuth = useSWRMutation<
    AuthorizationResponse,
    Error,
    '/api/tools/auth/waitForCompletion',
    waitForAuthParams
  >(
    '/api/tools/auth/waitForCompletion',
    async (url, { arg }: { arg: waitForAuthParams }) => {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(arg),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to wait for authorization');
      }

      return response.json();
    },
  );

  return {
    executeTool,
    checkAuth,
    waitForAuth,
  };
}
