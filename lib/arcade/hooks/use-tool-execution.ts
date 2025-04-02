import { useRef, useLayoutEffect, useCallback, useMemo } from 'react';
import { formatOpenAIToolNameToArcadeToolName } from '@/lib/arcade/utils';
import type { ToolInvocation } from 'ai';
import { useDebounceCallback } from 'usehooks-ts';
import type { AuthorizationResponse } from '@arcadeai/arcadejs/resources/shared.mjs';
import { executeTool, waitForAuthAndExecute } from '../actions';

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

  const formattedToolName = useMemo(
    () => formatOpenAIToolNameToArcadeToolName(toolName),
    [toolName],
  );

  const executeToolCallback = useCallback(async () => {
    if (isToolResult) {
      return;
    }

    const result = await executeTool({
      toolName,
      args,
    });

    if (result.error) {
      console.error('Error executing tool:', result.error);
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
        const authResult = await waitForAuthAndExecute({
          authId: result.authResponse.id,
          toolName,
          args,
        });

        if (authResult.error) {
          console.error('Error waiting for auth:', authResult.error);
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
  }, [
    isToolResult,
    toolName,
    args,
    setAuthResponse,
    addToolResult,
    toolInvocation.toolCallId,
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
    args,
    isToolResult,
    debouncedExecute,
  ]);
};
