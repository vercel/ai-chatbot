'use client';

import { ToolCallRenderer, ToolResultRenderer } from '../tool-invocations';

interface ToolInvocationPartProps {
  toolInvocation: {
    toolName: string;
    toolCallId: string;
    state: 'call' | 'result';
    args?: any;
    result?: any;
  };
  isReadonly: boolean;
}

export function ToolInvocationPart({
  toolInvocation,
  isReadonly,
}: ToolInvocationPartProps) {
  const { toolName, toolCallId, state } = toolInvocation;

  if (state === 'call') {
    const { args } = toolInvocation;
    return (
      <ToolCallRenderer
        toolName={toolName}
        toolCallId={toolCallId}
        state={state}
        args={args}
        isReadonly={isReadonly}
      />
    );
  }

  if (state === 'result') {
    const { result } = toolInvocation;
    return (
      <ToolResultRenderer
        toolName={toolName}
        toolCallId={toolCallId}
        state={state}
        result={result}
        isReadonly={isReadonly}
      />
    );
  }

  return null;
}
