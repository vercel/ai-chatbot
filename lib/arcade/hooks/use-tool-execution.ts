import { useRef, useLayoutEffect, useCallback, useMemo } from 'react';
import { client } from '@/lib/arcade/client';
import { formatOpenAIToolNameToArcadeToolName } from '@/lib/arcade/utils';
import type { ToolInvocation } from 'ai';
import { useDebounceCallback } from 'usehooks-ts';
import { PermissionDeniedError } from '@arcadeai/arcadejs';
import type { AuthorizationResponse } from '@arcadeai/arcadejs/resources/shared.mjs';

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

  const executeTool = useCallback(async () => {
    if (isToolResult) {
      return;
    }
    const tool = await client.tools.get(formattedToolName);
    if (!tool) {
      return;
    }

    try {
      const result = await client.tools.execute({
        tool_name: formattedToolName,
        input: args,
        user_id: 'sdserranog@gmail.com',
      });

      addToolResult({
        toolCallId: toolInvocation.toolCallId,
        result,
      });
    } catch (error) {
      if (error instanceof PermissionDeniedError) {
        const authInfo = await client.tools.authorize({
          tool_name: formattedToolName,
          user_id: 'sdserranog@gmail.com',
        });
        setAuthResponse(authInfo);

        // If we've already started checking this ID, don't start again
        if (authInfo.id && !hasStartedChecking.current.has(authInfo.id)) {
          hasStartedChecking.current.add(authInfo.id);
          await client.auth.waitForCompletion(authInfo).then(async (auth) => {
            setAuthResponse(auth);
            const result = await client.tools.execute({
              tool_name: formattedToolName,
              input: args,
              user_id: 'sdserranog@gmail.com',
            });
            addToolResult({
              toolCallId: toolInvocation.toolCallId,
              result,
            });
          });
        }
      } else {
        console.error('Error executing tool', error);
      }
    }
  }, [
    formattedToolName,
    isToolResult,
    args,
    addToolResult,
    toolInvocation.toolCallId,
    setAuthResponse,
  ]);

  const debouncedExecute = useDebounceCallback(executeTool, 1000);

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
