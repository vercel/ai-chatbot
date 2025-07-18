'use client';

import { SlackIcon } from './icons';

interface SlackToolProps {
  toolCallId: string;
  state: 'input-available' | 'output-available';
  output?: any;
  input?: any;
  isReadonly?: boolean;
}

function formatSlackParameters(input: any, toolType: string): string {
  if (!input) return '';

  switch (toolType) {
    case 'tool-listAccessibleSlackChannels': {
      return '(listing accessible channels)';
    }

    case 'tool-fetchSlackChannelHistory': {
      const params = [];
      if (input.channel) params.push(`channel: ${input.channel}`);
      if (input.limit) params.push(`limit: ${input.limit}`);
      return params.length > 0 ? `(${params.join(', ')})` : '';
    }

    case 'tool-getBulkSlackHistory': {
      const params = [];
      if (input.channels && input.channels.length > 0) {
        params.push(`channels: ${input.channels.length}`);
      }
      if (input.limit) params.push(`limit: ${input.limit}`);
      return params.length > 0 ? `(${params.join(', ')})` : '';
    }

    case 'tool-getSlackThreadReplies': {
      const params = [];
      if (input.channel) params.push(`channel: ${input.channel}`);
      if (input.thread_ts) params.push(`thread: ${input.thread_ts}`);
      return params.length > 0 ? `(${params.join(', ')})` : '';
    }

    default:
      return '';
  }
}

export function SlackTool({
  toolCallId,
  state,
  output,
  input,
  isReadonly = false,
}: SlackToolProps) {
  // Determine tool type from toolCallId
  const toolType = toolCallId.includes('listAccessibleSlackChannels')
    ? 'tool-listAccessibleSlackChannels'
    : toolCallId.includes('fetchSlackChannelHistory')
      ? 'tool-fetchSlackChannelHistory'
      : toolCallId.includes('getBulkSlackHistory')
        ? 'tool-getBulkSlackHistory'
        : toolCallId.includes('getSlackThreadReplies')
          ? 'tool-getSlackThreadReplies'
          : 'unknown';

  if (state === 'input-available') {
    const params = formatSlackParameters(input, toolType);
    const action =
      toolType === 'tool-listAccessibleSlackChannels'
        ? 'Listing slack channels'
        : 'Fetching slack messages';

    return (
      <div className="pt-1.5 pb-4 border-b border-muted text-sm flex items-center gap-2">
        <SlackIcon size={16} />
        {action} {params}
      </div>
    );
  }

  if (state === 'output-available') {
    // Check for errors - handle both direct error objects and JSON string responses
    let hasError = false;
    let errorMessage = '';

    try {
      if (output && typeof output === 'object' && 'error' in output) {
        hasError = true;
        errorMessage = String(output.error);
      } else if (typeof output === 'string') {
        const parsed = JSON.parse(output);
        if (parsed && typeof parsed === 'object' && 'error' in parsed) {
          hasError = true;
          errorMessage = String(parsed.error);
        }
      }
    } catch {
      // If parsing fails, continue with normal flow
    }

    if (hasError) {
      return (
        <div className="text-red-500 p-2 border rounded">
          Error: {errorMessage}
        </div>
      );
    }

    const params = formatSlackParameters(input, toolType);
    const action =
      toolType === 'tool-listAccessibleSlackChannels'
        ? 'Listed slack channels'
        : 'Fetched slack messages';

    return (
      <div className="pt-1.5 pb-4 border-b border-muted text-sm flex items-center gap-2">
        <SlackIcon size={16} />
        {action} {params}
      </div>
    );
  }

  return null;
}
