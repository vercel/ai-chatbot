'use client';

import { useState } from 'react';
import { ChevronDownIcon, ChevronRightIcon } from './icons';

export interface ToolConfig {
  icon: React.ComponentType<{ size?: number }>;
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
  const [showDetails, setShowDetails] = useState(false);

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

  if (error) {
    return (
      <div className="text-red-500 p-1.5 border rounded text-xs">
        Error: {error}
      </div>
    );
  }

  const params = config.formatParameters(input, toolType);
  const actionText = config.getAction(
    toolType,
    state === 'input-available' ? 'input' : 'output',
  );
  const resultSummary =
    state === 'output-available' && config.getResultSummary
      ? config.getResultSummary(output, input, toolType)
      : '';

  const handleToggle = () => {
    if (input || output) {
      setShowDetails(!showDetails);
    }
  };

  return (
    <div className="border-b border-muted/50 last:border-b-0">
      <button
        type="button"
        className={`flex items-center justify-between w-full text-left px-1.5 py-2 rounded transition-colors ${input || output ? 'cursor-pointer hover:bg-muted/30' : 'cursor-default'}`}
        onClick={handleToggle}
        aria-label={showDetails ? 'Hide details' : 'Show details'}
      >
        <div className="text-sm flex items-center gap-1.5 text-muted-foreground">
          <Icon size={14} />
          <span className="font-medium">{actionText}</span>
          {params && <span className="text-muted-foreground/70">{params}</span>}
          {resultSummary && (
            <span className="text-green-600 dark:text-green-400">
              {resultSummary}
            </span>
          )}
        </div>

        {(input || output) && (
          <div className="text-muted-foreground/50">
            {showDetails ? (
              <ChevronDownIcon size={14} />
            ) : (
              <ChevronRightIcon size={14} />
            )}
          </div>
        )}
      </button>

      {showDetails && (
        <div className="mt-2 space-y-2 text-xs">
          {input && (
            <div>
              <div className="font-medium text-muted-foreground/70 mb-1 text-xs">
                Parameters:
              </div>
              <pre className="bg-muted/50 p-1.5 rounded text-xs overflow-x-auto">
                {JSON.stringify(input, null, 2)}
              </pre>
            </div>
          )}

          {output && state === 'output-available' && (
            <div>
              <div className="font-medium text-muted-foreground/70 mb-1 text-xs">
                Output:
              </div>
              <pre className="bg-muted/50 p-1.5 rounded text-xs overflow-auto max-h-32">
                {typeof output === 'string'
                  ? output
                  : JSON.stringify(output, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
