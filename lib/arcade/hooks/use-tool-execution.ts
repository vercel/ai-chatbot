import { useRef, useLayoutEffect, useCallback, useMemo, useState } from 'react';
import { formatOpenAIToolNameToArcadeToolName } from '@/lib/arcade/utils';
import type { ToolInvocation } from 'ai';
import { useDebounceCallback } from 'usehooks-ts';
import type { AuthorizationResponse } from '@arcadeai/arcadejs/resources/shared.mjs';
import { useToolExecution as useToolExecutionApi } from '@/hooks/use-tool-execution';

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
};

export const useToolExecution = ({
  toolInvocation,
  addToolResult,
  setAuthResponse,
}: UseToolExecutionProps) => {
  const { args, toolName } = toolInvocation;
  const isToolResult = toolInvocation.state === 'result';
  const hasStartedChecking = useRef<Set<string>>(new Set());
  const isExecuting = useRef<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const formattedToolName = useMemo(
    () => formatOpenAIToolNameToArcadeToolName(toolName),
    [toolName],
  );

  const { executeTool, waitForAuth } = useToolExecutionApi();

  const executeToolCallback = useCallback(async () => {
    if (isToolResult || isExecuting.current) {
      return;
    }

    isExecuting.current = true;
    setError(null);

    try {
      const result = await executeTool.trigger({
        toolName,
        args,
      });

      if (result.error) {
        console.error('Error executing tool:', result.error);
        setError(JSON.stringify(result.error));
        return;
      }

      if (result.authResponse) {
        setAuthResponse(result.authResponse);

        // If we've already started checking this ID, don't start again
        if (
          result.authResponse.id &&
          !hasStartedChecking.current.has(result.authResponse.id)
        ) {
          hasStartedChecking.current.add(result.authResponse.id);
          const authResult = await waitForAuth.trigger({
            authId: result.authResponse.id,
            toolName,
            args,
          });

          if (authResult.error) {
            console.error('Error waiting for auth:', authResult.error);
            setError(JSON.stringify(authResult.error));
            return;
          }

          if (authResult.result) {
            addToolResult({
              toolCallId: toolInvocation.toolCallId,
              result: authResult.result,
            });
          }

          if (authResult.authResponse) {
            setAuthResponse(authResult.authResponse);
          }
        }
      } else if (result.result) {
        addToolResult({
          toolCallId: toolInvocation.toolCallId,
          result: result.result,
        });
      }
    } catch (error) {
      console.error('Error in tool execution:', error);
      setError(
        error instanceof Error ? error.message : 'An unexpected error occurred',
      );
    } finally {
      isExecuting.current = false;
    }
  }, [
    isToolResult,
    toolName,
    args,
    setAuthResponse,
    addToolResult,
    toolInvocation.toolCallId,
    executeTool,
    waitForAuth,
  ]);

  const debouncedExecute = useDebounceCallback(executeToolCallback, 1000);

  useLayoutEffect(() => {
    debouncedExecute();

    return () => {
      debouncedExecute.cancel();
    };
  }, [
    toolInvocation,
    formattedToolName,
    addToolResult,
    setAuthResponse,
    debouncedExecute,
  ]);

  return {
    error,
    isExecuting: isExecuting.current,
  };
};
