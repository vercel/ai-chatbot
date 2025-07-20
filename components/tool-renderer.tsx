'use client';

import { UnifiedTool } from './unified-tool';
import { 
  gmailToolConfig, 
  slackToolConfig, 
  transcriptToolConfig, 
  calendarToolConfig 
} from './tool-configs';

interface ToolRendererProps {
  toolCallId: string;
  state: 'input-available' | 'output-available';
  output?: any;
  input?: any;
  isReadonly?: boolean;
  type: string; // The tool type like 'tool-listGmailMessages'
}

// Map tool types to their configurations
const TOOL_CONFIG_MAP = {
  // Gmail tools
  'tool-listGmailMessages': gmailToolConfig,
  'tool-getGmailMessageDetails': gmailToolConfig,
  
  // Slack tools
  'tool-listAccessibleSlackChannels': slackToolConfig,
  'tool-fetchSlackChannelHistory': slackToolConfig,
  'tool-getBulkSlackHistory': slackToolConfig,
  'tool-getSlackThreadReplies': slackToolConfig,
  
  // Transcript tools
  'tool-searchTranscriptsByKeyword': transcriptToolConfig,
  'tool-searchTranscriptsByUser': transcriptToolConfig,
  'tool-getTranscriptDetails': transcriptToolConfig,
  
  // Calendar tools
  'tool-listGoogleCalendarEvents': calendarToolConfig,
} as const;

export function ToolRenderer({
  toolCallId,
  state,
  output,
  input,
  isReadonly = false,
  type,
}: ToolRendererProps) {
  const config = TOOL_CONFIG_MAP[type as keyof typeof TOOL_CONFIG_MAP];
  
  if (!config) {
    // Fallback for unknown tool types
    console.warn(`Unknown tool type: ${type}`);
    return null;
  }
  
  return (
    <UnifiedTool
      toolCallId={toolCallId}
      state={state}
      output={output}
      input={input}
      isReadonly={isReadonly}
      config={config}
    />
  );
}