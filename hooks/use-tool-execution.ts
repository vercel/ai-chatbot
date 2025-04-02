import useSWRMutation from 'swr/mutation';
import type { ExecuteToolResult } from '@/lib/arcade/server';

interface ExecuteToolParams {
  toolName: string;
  args: any;
}

interface WaitForAuthParams extends ExecuteToolParams {
  authId: string;
}

export function useToolExecution() {
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

  const waitForAuth = useSWRMutation<
    ExecuteToolResult,
    Error,
    '/api/tools/auth',
    WaitForAuthParams
  >('/api/tools/auth', async (url, { arg }: { arg: WaitForAuthParams }) => {
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

  return {
    executeTool,
    waitForAuth,
  };
}
