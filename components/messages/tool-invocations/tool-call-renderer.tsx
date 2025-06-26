'use client';

import cx from 'classnames';
import { Weather } from '../../weather';
import { Chart } from '../../chart';
import { DocumentPreview } from '../../document-preview';
import { DocumentToolCall } from '../../document';
import { SnowflakeSqlCall } from '../../snowflake-sql';
import { McpToolCall } from '../../mcp-tool';
import type { ToolInvocationProps } from '../types';

interface ToolCallRendererProps extends ToolInvocationProps {
  args: any;
}

export function ToolCallRenderer({
  toolName,
  toolCallId,
  args,
  isReadonly,
}: ToolCallRendererProps) {
  const isSkeletonTool = ['getWeather', 'getChart'].includes(toolName);

  return (
    <div
      key={toolCallId}
      className={cx({
        skeleton: isSkeletonTool,
      })}
    >
      {renderToolCall(toolName, args, isReadonly)}
    </div>
  );
}

function renderToolCall(toolName: string, args: any, isReadonly: boolean) {
  switch (toolName) {
    case 'getWeather':
      return <Weather />;

    case 'getChart':
      return <Chart args={args} />;

    case 'createDocument':
      return <DocumentPreview isReadonly={isReadonly} args={args} />;

    case 'updateDocument':
      return (
        <DocumentToolCall type="update" args={args} isReadonly={isReadonly} />
      );

    case 'requestSuggestions':
      return (
        <DocumentToolCall
          type="request-suggestions"
          args={args}
          isReadonly={isReadonly}
        />
      );

    case 'snowflakeSqlTool':
      return <SnowflakeSqlCall args={args} isReadonly={isReadonly} />;

    default:
      return (
        <McpToolCall toolName={toolName} args={args} isReadonly={isReadonly} />
      );
  }
}
