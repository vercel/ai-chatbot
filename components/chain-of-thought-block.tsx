'use client';

import type { ChatMessage } from '@/lib/types';
import {
  ChainOfThought,
  ChainOfThoughtContent,
  ChainOfThoughtHeader,
  ChainOfThoughtStep,
  ChainOfThoughtSearchResults,
  ChainOfThoughtSearchResult,
} from '@/components/elements/chain-of-thought';
import { LoadingText } from '@/components/elements/loading-text';
import { Response } from '@/components/elements/response';
import { ToolRenderer } from '@/components/tool-renderer';
import {
  Tool,
  ToolHeader,
  ToolContent,
  ToolInput,
  ToolOutput,
} from '@/components/elements/tool';
import { Weather } from '@/components/weather';
import { DocumentPreview } from '@/components/document-preview';
import { DocumentToolResult } from '@/components/document';
import {
  gmailToolConfig,
  slackToolConfig,
  transcriptToolConfig,
  calendarToolConfig,
  mem0ToolConfig,
} from '@/components/tool-configs';
import { extractReasoningTitleAndBody } from '@/lib/utils';

type Props = {
  message: ChatMessage;
  isLoading: boolean;
  isReadonly: boolean;
};

type ToolState = 'input-available' | 'output-available';

function isCoTPart(part: any) {
  const t = part?.type as string | undefined;
  if (!t) return false;
  if (t === 'reasoning') {
    const txt = (part as any)?.text;
    return typeof txt === 'string' && txt.trim().length > 0;
  }
  return t.startsWith('tool-');
}

export function ChainOfThoughtBlock({ message, isLoading, isReadonly }: Props) {
  const parts = message.parts ?? [];

  // Find all CoT parts from the first CoT part up to (but not including) the first non-empty text part.
  // This prevents later reasoning steps (before the final answer) from escaping the chain.
  let firstIndex: number | null = null;
  let endBoundaryIndex: number | null = null;

  for (let i = 0; i < parts.length; i++) {
    const p = parts[i];
    const t = p?.type as string | undefined;
    if (firstIndex === null) {
      if (isCoTPart(p)) firstIndex = i;
      continue;
    }
    // After we've seen a CoT part, stop when we hit the first normal text block
    if (
      t === 'text' &&
      typeof (p as any)?.text === 'string' &&
      (p as any).text.trim().length > 0
    ) {
      endBoundaryIndex = i - 1; // stop before this text
      break;
    }
  }

  if (firstIndex === null) return null;
  if (endBoundaryIndex === null) endBoundaryIndex = parts.length - 1;

  // Only include reasoning/tool parts inside the boundary (ignore other types in-between)
  const cotParts = parts
    .slice(firstIndex, endBoundaryIndex + 1)
    .filter((p) => isCoTPart(p));

  // If no renderable steps remain, don't render the block at all
  if (cotParts.length === 0) return null;

  type ToolPartLike = {
    state?: ToolState | 'input-streaming' | 'output-error';
    input?: any;
    output?: any;
    errorText?: any;
    toolCallId?: string;
  };

  const getToolPart = (p: unknown): ToolPartLike => (p as ToolPartLike) || {};

  // Determine the most recent step title (reasoning or tool) to display while loading
  const latestStepTitle = (() => {
    let title: string | undefined;
    for (let i = 0; i < cotParts.length; i++) {
      const p = cotParts[i] as any;
      const type = p?.type as string;

      // Handle reasoning titles
      if (type === 'reasoning' && typeof p.text === 'string' && p.text.trim()) {
        const parsed = extractReasoningTitleAndBody(p.text);
        if (parsed.title) title = parsed.title;
      }

      // Handle tool step titles
      if (type?.startsWith('tool-')) {
        const toolPart = getToolPart(p);
        const state = (toolPart.state ?? 'input-available') as ToolState;

        // Special cases for specific tools
        if (type === 'tool-web_search_preview') {
          const isInput = state === 'input-available';
          title = isInput ? 'Searching for information' : 'Search completed';
        } else if (type === 'tool-file_search') {
          const isInput = state === 'input-available';
          title = isInput
            ? 'Searching uploaded knowledge'
            : 'Knowledge search complete';
        } else if (type === 'tool-get_file_contents') {
          const isInput = state === 'input-available';
          title = isInput
            ? 'Retrieving file contents'
            : 'File contents retrieved';
        } else if (type === 'tool-getWeather') {
          const isInput = state === 'input-available';
          title = isInput ? 'Checking weather' : 'Weather';
        } else if (type === 'tool-createDocument') {
          const isInput = state === 'input-available';
          title = isInput ? 'Creating document' : 'Document created';
        } else if (type === 'tool-updateDocument') {
          const isInput = state === 'input-available';
          title = isInput ? 'Updating document' : 'Document updated';
        } else if (type === 'tool-requestSuggestions') {
          const isInput = state === 'input-available';
          title = isInput ? 'Requesting suggestions' : 'Suggestions ready';
        } else {
          // Use tool config for other tools
          const TOOL_CONFIG_MAP = {
            'tool-listGmailMessages': gmailToolConfig,
            'tool-getGmailMessageDetails': gmailToolConfig,
            'tool-listAccessibleSlackChannels': slackToolConfig,
            'tool-fetchSlackChannelHistory': slackToolConfig,
            'tool-getBulkSlackHistory': slackToolConfig,
            'tool-getSlackThreadReplies': slackToolConfig,
            'tool-searchTranscriptsByKeyword': transcriptToolConfig,
            'tool-searchTranscriptsByUser': transcriptToolConfig,
            'tool-getTranscriptDetails': transcriptToolConfig,
            'tool-listGoogleCalendarEvents': calendarToolConfig,
            'tool-getMem0Projects': mem0ToolConfig,
            'tool-getMem0Memories': mem0ToolConfig,
            'tool-createMem0Project': mem0ToolConfig,
            'tool-createMem0Memory': mem0ToolConfig,
          } as const;

          const cfg = (TOOL_CONFIG_MAP as any)[type];
          const isInput = state === 'input-available';
          if (cfg) {
            title = cfg.getAction(type, isInput ? 'input' : 'output');
          } else {
            title = isInput ? 'Running tool' : 'Tool result';
          }
        }
      }
    }
    return title;
  })();

  return (
    <ChainOfThought isWorking={isLoading}>
      <ChainOfThoughtHeader>
        {isLoading ? (
          <LoadingText>{latestStepTitle || 'Working'}</LoadingText>
        ) : undefined}
      </ChainOfThoughtHeader>
      <ChainOfThoughtContent>
        {cotParts.map((part, idx) => {
          const cotStartIndex = firstIndex as number;
          const key = `cot-${message.id}-${cotStartIndex + idx}`;
          const type = part.type as string;

          if (type === 'reasoning') {
            const parsed =
              typeof (part as any).text === 'string'
                ? extractReasoningTitleAndBody((part as any).text)
                : { body: '' };
            // Skip empty reasoning parts (prelude placeholders)
            if (!(parsed.title || parsed.body?.trim().length)) {
              return null;
            }
            return (
              <ChainOfThoughtStep
                key={key}
                label={parsed.title}
                status={isLoading ? 'active' : 'complete'}
                collapsible
                defaultOpen={false}
              >
                {parsed.body && (
                  <Response className="text-sm text-muted-foreground/90">
                    {parsed.body}
                  </Response>
                )}
              </ChainOfThoughtStep>
            );
          }

          if (type.startsWith('tool-')) {
            const toolPart = getToolPart(part);
            const state = (toolPart.state ?? 'input-available') as ToolState;

            // Handle web search as a discrete step
            if (type === 'tool-web_search_preview') {
              const isInput = state === 'input-available';
              return (
                <ChainOfThoughtStep
                  key={key}
                  label={
                    isInput ? 'Searching for information' : 'Search completed'
                  }
                  status={isInput ? 'active' : 'complete'}
                />
              );
            }

            if (type === 'tool-file_search') {
              const isInput = state === 'input-available';
              return (
                <ChainOfThoughtStep
                  key={key}
                  label={
                    isInput
                      ? 'Searching uploaded knowledge'
                      : 'Knowledge search complete'
                  }
                  status={isInput ? 'active' : 'complete'}
                />
              );
            }

            if (type === 'tool-get_file_contents') {
              const isInput = state === 'input-available';
              return (
                <ChainOfThoughtStep
                  key={key}
                  label={
                    isInput
                      ? 'Retrieving file contents'
                      : 'File contents retrieved'
                  }
                  status={isInput ? 'active' : 'complete'}
                />
              );
            }

            // Map of known tool types to configs
            const TOOL_CONFIG_MAP = {
              'tool-listGmailMessages': gmailToolConfig,
              'tool-getGmailMessageDetails': gmailToolConfig,
              'tool-listAccessibleSlackChannels': slackToolConfig,
              'tool-fetchSlackChannelHistory': slackToolConfig,
              'tool-getBulkSlackHistory': slackToolConfig,
              'tool-getSlackThreadReplies': slackToolConfig,
              'tool-searchTranscriptsByKeyword': transcriptToolConfig,
              'tool-searchTranscriptsByUser': transcriptToolConfig,
              'tool-getTranscriptDetails': transcriptToolConfig,
              'tool-listGoogleCalendarEvents': calendarToolConfig,
              'tool-getMem0Projects': mem0ToolConfig,
              'tool-getMem0Memories': mem0ToolConfig,
              'tool-createMem0Project': mem0ToolConfig,
              'tool-createMem0Memory': mem0ToolConfig,
              // app-specific helpers below still render via UnifiedTool body
              'tool-getWeather': undefined,
              'tool-createDocument': undefined,
              'tool-updateDocument': undefined,
              'tool-requestSuggestions': undefined,
            } as const;

            const cfg = (TOOL_CONFIG_MAP as any)[type];
            const isInput = state === 'input-available';
            const label = cfg
              ? cfg.getAction(type, isInput ? 'input' : 'output')
              : isInput
                ? 'Running tool'
                : 'Tool result';
            const summary: string | undefined =
              !isInput && cfg && cfg.getResultSummary
                ? cfg.getResultSummary(toolPart.output, toolPart.input, type)
                : undefined;

            // Specialized inline render for app-local tools
            if (type === 'tool-getWeather') {
              return (
                <ChainOfThoughtStep
                  key={key}
                  label={isInput ? 'Checking weather' : 'Weather'}
                  status={isInput ? 'active' : 'complete'}
                >
                  <Tool defaultOpen={false}>
                    <ToolHeader type="tool-getWeather" state={state} />
                    <ToolContent>
                      {state === 'input-available' && (
                        <ToolInput input={toolPart.input} />
                      )}
                      {state === 'output-available' && (
                        <ToolOutput
                          output={
                            <Weather weatherAtLocation={toolPart.output} />
                          }
                          errorText={undefined}
                        />
                      )}
                    </ToolContent>
                  </Tool>
                </ChainOfThoughtStep>
              );
            }

            if (type === 'tool-createDocument') {
              return (
                <ChainOfThoughtStep
                  key={key}
                  label={isInput ? 'Creating document' : 'Document created'}
                  status={isInput ? 'active' : 'complete'}
                >
                  {state === 'output-available' &&
                  toolPart.output &&
                  'error' in (toolPart.output as any) ? (
                    <div className="p-4 text-red-500 bg-red-50 rounded-lg border border-red-200 dark:bg-red-950/50">
                      Error creating document:{' '}
                      {String((toolPart.output as any).error)}
                    </div>
                  ) : (
                    state === 'output-available' && (
                      <DocumentPreview
                        isReadonly={isReadonly}
                        result={toolPart.output}
                      />
                    )
                  )}
                </ChainOfThoughtStep>
              );
            }

            if (type === 'tool-updateDocument') {
              return (
                <ChainOfThoughtStep
                  key={key}
                  label={isInput ? 'Updating document' : 'Document updated'}
                  status={isInput ? 'active' : 'complete'}
                >
                  {state === 'output-available' &&
                  toolPart.output &&
                  'error' in (toolPart.output as any) ? (
                    <div className="p-4 text-red-500 bg-red-50 rounded-lg border border-red-200 dark:bg-red-950/50">
                      Error updating document:{' '}
                      {String((toolPart.output as any).error)}
                    </div>
                  ) : (
                    state === 'output-available' && (
                      <div className="relative">
                        <DocumentPreview
                          isReadonly={isReadonly}
                          result={toolPart.output}
                          args={{
                            ...((toolPart.output ?? {}) as any),
                            isUpdate: true,
                          }}
                        />
                      </div>
                    )
                  )}
                </ChainOfThoughtStep>
              );
            }

            if (type === 'tool-requestSuggestions') {
              return (
                <ChainOfThoughtStep
                  key={key}
                  label={
                    isInput ? 'Requesting suggestions' : 'Suggestions ready'
                  }
                  status={isInput ? 'active' : 'complete'}
                >
                  <Tool defaultOpen={false}>
                    <ToolHeader type="tool-requestSuggestions" state={state} />
                    <ToolContent>
                      {state === 'input-available' && (
                        <ToolInput input={toolPart.input} />
                      )}
                      {state === 'output-available' && (
                        <ToolOutput
                          output={
                            toolPart.output &&
                            'error' in (toolPart.output as any) ? (
                              <div className="p-2 text-red-500 rounded border">
                                Error: {String((toolPart.output as any).error)}
                              </div>
                            ) : (
                              <DocumentToolResult
                                type="request-suggestions"
                                result={toolPart.output}
                                isReadonly={isReadonly}
                              />
                            )
                          }
                          errorText={undefined}
                        />
                      )}
                    </ToolContent>
                  </Tool>
                </ChainOfThoughtStep>
              );
            }

            return (
              <ChainOfThoughtStep
                key={key}
                label={label}
                status={isInput ? 'active' : 'complete'}
              >
                {/* Optional compact badges when we have a summary */}
                {!isInput && summary && (
                  <ChainOfThoughtSearchResults>
                    <ChainOfThoughtSearchResult>
                      {summary}
                    </ChainOfThoughtSearchResult>
                  </ChainOfThoughtSearchResults>
                )}

                {/* Render the unified expandable Tool UI directly */}
                <div className="mt-1 w-full min-w-0 overflow-hidden">
                  <ToolRenderer
                    toolCallId={toolPart.toolCallId as string}
                    state={state}
                    output={toolPart.output}
                    input={toolPart.input}
                    isReadonly={isReadonly}
                    type={type}
                    defaultOpen={false}
                  />
                </div>
              </ChainOfThoughtStep>
            );
          }

          return null;
        })}
      </ChainOfThoughtContent>
    </ChainOfThought>
  );
}
