'use client';

import { Tool, ToolHeader, ToolContent, ToolInput, ToolOutput } from './elements/tool';

export interface ToolConfig {
  icon: React.ComponentType<{ size?: number }>;
  displayName: string;
  getAction: (toolType: string, state: 'input' | 'output') => string;
  formatParameters: (input: any, toolType: string) => string;
  getToolType: (toolCallId: string) => string;
  getResultSummary?: (output: any, input: any, toolType: string) => string;
}

interface UnifiedToolProps {
  toolCallId: string;
  state: 'input-available' | 'output-available';
  output?: any;
  input?: any;
  isReadonly?: boolean;
  config: ToolConfig;
}

export function UnifiedTool({
  toolCallId,
  state,
  output,
  input,
  isReadonly = false,
  config,
}: UnifiedToolProps) {
  const toolType = config.getToolType(toolCallId);
  const Icon = config.icon;

  // Check for errors
  const getError = () => {
    if (!output) return null;

    try {
      if (typeof output === 'object' && 'error' in output) {
        return String(output.error);
      }
      if (typeof output === 'string') {
        const parsed = JSON.parse(output);
        if (parsed && typeof parsed === 'object' && 'error' in parsed) {
          return String(parsed.error);
        }
      }
    } catch {
      // If parsing fails, no error
    }
    return null;
  };

  const error = state === 'output-available' ? getError() : null;

  const params = config.formatParameters(input, toolType);
  const actionText = config.getAction(
    toolType,
    state === 'input-available' ? 'input' : 'output',
  );
  const resultSummary =
    state === 'output-available' && config.getResultSummary
      ? config.getResultSummary(output, input, toolType)
      : '';

  return (
    <Tool defaultOpen={true}>
      <ToolHeader type={toolType} state={state} label={config.displayName || toolType} icon={Icon} />
      <ToolContent>
        {input && <ToolInput input={input} />}

        {state === 'output-available' && (
          <ToolOutput
            errorText={error ?? undefined}
            output={
              !error && output
                ? (
                    <pre className="p-1.5 text-xs overflow-auto max-h-40">
                      {typeof output === 'string'
                        ? output
                        : JSON.stringify(output, null, 2)}
                    </pre>
                  )
                : undefined
            }
          />
        )}
      </ToolContent>
    </Tool>
  );
}
