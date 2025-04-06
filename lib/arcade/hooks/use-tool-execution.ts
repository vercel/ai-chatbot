import { useRef, useCallback, useState, useLayoutEffect } from 'react';
import type { ToolInvocation } from 'ai';
import { useDebounceCallback } from 'usehooks-ts';
import type { AuthorizationResponse } from '@arcadeai/arcadejs/resources/shared.mjs';
import { useToolExecutionApi } from '@/lib/arcade/hooks/use-tool-execution-api';

type UseToolExecutionProps = {
  toolInvocation: ToolInvocation;
  addToolResult: ({
    toolCallId,
    result,
  }: {
    toolCallId: string;
    result: any;
  }) => void;
  setAuthResponse: (response: AuthorizationResponse) => void;
  needsHumanInTheLoop: boolean;
};

export const useToolExecution = ({
  toolInvocation,
  addToolResult,
  setAuthResponse,
  needsHumanInTheLoop,
}: UseToolExecutionProps) => {
  const { args, toolName } = toolInvocation;
  const hasStartedChecking = useRef<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const { executeTool, checkAuth, waitForAuth } = useToolExecutionApi();

  const executeToolCallback = useCallback(async () => {
    // If the tool has already been executed, don't execute it again
    if (hasStartedChecking.current.has(toolInvocation.toolCallId)) {
      return;
    }
    hasStartedChecking.current.add(toolInvocation.toolCallId);
    setError(null);

    try {
      // Check if the tool requires authorization
      let authResponse = await checkAuth.trigger({
        toolName,
      });

      // If the tool requires user interaction or the auth response failed, don't execute the tool
      if (needsHumanInTheLoop || authResponse.id === undefined) {
        return;
      }

      // If the auth response is pending we need to wait until it's completed
      if (authResponse.status === 'pending') {
        setAuthResponse(authResponse);
        authResponse = await waitForAuth.trigger({
          authId: authResponse.id,
        });
        setAuthResponse(authResponse);

        if (authResponse.status !== 'completed') {
          setError(
            `Authorization failed with status: ${authResponse.status}. Please try again.`,
          );
          return;
        }
      }

      addToolResult({
        toolCallId: toolInvocation.toolCallId,
        result: await executeTool.trigger({
          toolName,
          args,
        }),
      });
    } catch (error) {
      console.error('Error in tool execution:', error);
      setError(
        error instanceof Error ? error.message : 'An unexpected error occurred',
      );
    } finally {
      hasStartedChecking.current.delete(toolInvocation.toolCallId);
    }
  }, [
    toolInvocation.toolCallId,
    checkAuth,
    toolName,
    setAuthResponse,
    needsHumanInTheLoop,
    executeTool,
    args,
    addToolResult,
    waitForAuth,
  ]);

  const debouncedExecute = useDebounceCallback(executeToolCallback, 1000);

  useLayoutEffect(() => {
    debouncedExecute();
    return () => {
      debouncedExecute.cancel();
    };
  }, [debouncedExecute]);

  return {
    error,
  };
};
