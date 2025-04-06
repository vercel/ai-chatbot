import { DocumentToolCall } from './document';

import type { ToolInvocation } from 'ai';
import { cx } from 'class-variance-authority';
import { Weather } from './weather';
import { DocumentPreview } from './document-preview';
import { ToolArcadeAuthorization } from './tool-arcade-authorization';

type ToolCallProps = {
  toolInvocation: ToolInvocation;
  isReadonly: boolean;
  addToolResult: ({
    toolCallId,
    result,
  }: {
    toolCallId: string;
    result: any;
  }) => void;
};

export function ToolCall({
  toolInvocation,
  isReadonly,
  addToolResult,
}: ToolCallProps) {
  const { args, toolName } = toolInvocation;

  if (toolName === 'getWeather') {
    return (
      <div className={cx({ skeleton: true })}>
        <Weather />
      </div>
    );
  }

  if (toolName === 'createDocument') {
    return (
      <div>
        <DocumentPreview isReadonly={isReadonly} args={args} />
      </div>
    );
  }

  if (toolName === 'updateDocument') {
    return (
      <div>
        <DocumentToolCall type="update" args={args} isReadonly={isReadonly} />
      </div>
    );
  }

  if (toolName === 'requestSuggestions') {
    return (
      <div>
        <DocumentToolCall
          type="request-suggestions"
          args={args}
          isReadonly={isReadonly}
        />
      </div>
    );
  }

  return (
    <div>
      <ToolArcadeAuthorization
        toolInvocation={toolInvocation}
        addToolResult={addToolResult}
      />
    </div>
  );
}
