'use client';

import { Weather } from '../../weather';
import { Chart } from '../../chart';
import { DocumentPreview } from '../../document-preview';
import { DocumentToolResult } from '../../document';
import { SnowflakeSqlResult } from '../../snowflake-sql';
import { McpToolResult } from '../../mcp-tool';
import type { ToolInvocationProps } from '../types';

interface ToolResultRendererProps extends ToolInvocationProps {
  result: any;
}

export function ToolResultRenderer({
  toolName,
  toolCallId,
  result,
  isReadonly,
}: ToolResultRendererProps) {
  return (
    <div key={toolCallId}>{renderToolResult(toolName, result, isReadonly)}</div>
  );
}

function renderToolResult(toolName: string, result: any, isReadonly: boolean) {
  switch (toolName) {
    case 'getWeather':
      return <Weather weatherAtLocation={result} />;

    case 'getChart':
      return <Chart result={result} />;

    case 'createDocument':
      return <DocumentPreview isReadonly={isReadonly} result={result} />;

    case 'updateDocument':
      return (
        <DocumentToolResult
          type="update"
          result={result}
          isReadonly={isReadonly}
        />
      );

    case 'requestSuggestions':
      return (
        <DocumentToolResult
          type="request-suggestions"
          result={result}
          isReadonly={isReadonly}
        />
      );

    case 'snowflakeSqlTool':
      return <SnowflakeSqlResult result={result} isReadonly={isReadonly} />;

    default:
      return (
        <McpToolResult
          toolName={toolName}
          result={result}
          isReadonly={isReadonly}
        />
      );
  }
}
