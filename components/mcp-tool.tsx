'use client';

import { memo, useState } from 'react';
import type { JSONValue } from 'ai';
import { LoaderIcon, CheckIcon, XIcon, ChevronDownIcon } from './icons';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';

interface McpToolCallProps {
  toolName: string;
  args: JSONValue;
  isReadonly?: boolean;
}

export const McpToolCall = memo<McpToolCallProps>(
  ({ toolName, args }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const formatToolName = (name: string) => {
      return name
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, str => str.toUpperCase())
        .trim();
    };

    const renderArgs = (args: JSONValue) => {
      if (typeof args === 'object' && args !== null) {
        const entries = Object.entries(args);
        if (entries.length === 0) return null;
        
        return (
          <div className="space-y-2">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Parameters
            </div>
            <div className="grid gap-2">
              {entries.map(([key, value]) => (
                <div key={key} className="flex items-start justify-between gap-3 p-2 bg-muted/30 rounded-md">
                  <span className="text-xs font-medium text-muted-foreground shrink-0">
                    {key}
                  </span>
                  <span className="font-mono text-xs text-right break-all">
                    {typeof value === 'string' ? value : JSON.stringify(value)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        );
      }
      return null;
    };

    return (
      <div className="border rounded-xl p-4 bg-background shadow-sm">
        <div className="flex items-start gap-3">
          <div className="flex items-center justify-center size-8 shrink-0 rounded-full border bg-amber-50 border-amber-200">
            <LoaderIcon size={16} />
          </div>
          
          <div className="flex-1 min-w-0 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="size-3 animate-spin rounded-full border-2 border-amber-400 border-t-transparent" />
                <div className="text-sm font-semibold text-foreground">
                  {formatToolName(toolName)}
                </div>
                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                  MCP Tool
                </span>
              </div>
              {args && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="h-6 w-6 p-0 hover:bg-amber-100"
                >
                  <ChevronDownIcon 
                    size={14} 
                    className={cn(
                      "transition-transform duration-200",
                      isExpanded ? "rotate-180" : ""
                    )}
                  />
                </Button>
              )}
            </div>
            
            <div className="text-sm text-muted-foreground">
              Executing tool via Model Context Protocol...
            </div>
            
            {args && isExpanded && renderArgs(args)}
          </div>
        </div>
      </div>
    );
  },
);

McpToolCall.displayName = 'McpToolCall';

interface McpToolResultProps {
  toolName: string;
  result: JSONValue;
  isReadonly?: boolean;
}

export const McpToolResult = memo<McpToolResultProps>(
  ({ toolName, result }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const formatToolName = (name: string) => {
      return name
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, str => str.toUpperCase())
        .trim();
    };

    const isError = typeof result === 'object' && result !== null && 'error' in result;

    const renderResult = (result: JSONValue) => {
      if (typeof result === 'string') {
        return (
          <div className="bg-muted/50 rounded-lg p-4 border">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
              Output
            </div>
            <pre className="whitespace-pre-wrap text-sm text-foreground font-mono overflow-auto max-h-60">
              {result}
            </pre>
          </div>
        );
      }

      if (typeof result === 'object' && result !== null) {
        if ('error' in result) {
          return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <XIcon size={16} />
                <div className="text-xs font-medium text-red-700 uppercase tracking-wider">
                  Error
                </div>
              </div>
              <div className="text-sm text-red-800 font-mono">{String(result.error)}</div>
            </div>
          );
        }

        if ('content' in result && Array.isArray(result.content)) {
          return (
            <div className="space-y-3">
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Content ({result.content.length} items)
              </div>
              {result.content.map((item: any, index: number) => (
                <div key={index} className="bg-muted/50 rounded-lg p-3 border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700">
                      {item.type || 'unknown'}
                    </span>
                    <span className="text-xs text-muted-foreground">#{index + 1}</span>
                  </div>
                  {item.type === 'text' ? (
                    <pre className="whitespace-pre-wrap text-sm font-mono">{item.text}</pre>
                  ) : (
                    <pre className="text-sm font-mono overflow-auto">{JSON.stringify(item, null, 2)}</pre>
                  )}
                </div>
              ))}
            </div>
          );
        }

        return (
          <div className="bg-muted/50 rounded-lg p-4 border">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
              JSON Response
            </div>
            <pre className="text-sm font-mono text-foreground overflow-auto max-h-60">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        );
      }

      return (
        <div className="bg-muted/50 rounded-lg p-4 border">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
            Output
          </div>
          <div className="text-sm font-mono">
            {String(result)}
          </div>
        </div>
      );
    };

    return (
      <div className={cn(
        "border rounded-xl p-4 bg-background shadow-sm",
        isError ? "border-red-200 bg-red-50/20" : "border-green-200 bg-green-50/20"
      )}>
        <div className="flex items-start gap-3">
          <div className={cn(
            "flex items-center justify-center size-8 shrink-0 rounded-full border",
            isError 
              ? "bg-red-50 border-red-200" 
              : "bg-green-50 border-green-200"
          )}>
            {isError ? (
              <XIcon size={16} className="text-red-600" />
            ) : (
              <CheckIcon size={16} className="text-green-600" />
            )}
          </div>
          
          <div className="flex-1 min-w-0 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={cn(
                  "text-sm font-semibold",
                  isError ? "text-red-800" : "text-green-800"
                )}>
                  {formatToolName(toolName)}
                </div>
                <span className={cn(
                  "inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border",
                  isError 
                    ? "bg-red-100 text-red-700 border-red-200" 
                    : "bg-green-100 text-green-700 border-green-200"
                )}>
                  {isError ? "Failed" : "Completed"}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className={cn(
                  "h-6 w-6 p-0",
                  isError ? "hover:bg-red-100" : "hover:bg-green-100"
                )}
              >
                <ChevronDownIcon 
                  size={14} 
                  className={cn(
                    "transition-transform duration-200",
                    isExpanded ? "rotate-180" : ""
                  )}
                />
              </Button>
            </div>
            
            {isExpanded && renderResult(result)}
          </div>
        </div>
      </div>
    );
  },
);

McpToolResult.displayName = 'McpToolResult';