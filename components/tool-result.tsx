import { DocumentPreview } from './document-preview';

import type { ToolInvocation } from 'ai';
import { Weather } from './weather';
import { DocumentToolResult } from './document';
import { ToolResultAccordion } from './tool-result-accordion';

type ToolResultProps = {
  toolInvocation: Extract<ToolInvocation, { state: 'result' }>;
  isReadonly: boolean;
};

export function ToolResult({ toolInvocation, isReadonly }: ToolResultProps) {
  const { result, toolName } = toolInvocation;

  if (toolName === 'getWeather') {
    return <Weather weatherAtLocation={result} />;
  }

  if (toolName === 'createDocument') {
    return <DocumentPreview isReadonly={isReadonly} result={result} />;
  }

  if (toolName === 'updateDocument') {
    return (
      <DocumentToolResult
        type="update"
        result={result}
        isReadonly={isReadonly}
      />
    );
  }

  if (toolName === 'requestSuggestions') {
    return (
      <DocumentToolResult
        type="request-suggestions"
        result={result}
        isReadonly={isReadonly}
      />
    );
  }

  return <ToolResultAccordion toolInvocation={toolInvocation} />;
}
