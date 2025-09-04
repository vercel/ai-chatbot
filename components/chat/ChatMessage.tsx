'use client';

import React from 'react';
import { marked } from 'marked';
import DOMPurify from 'isomorphic-dompurify';
import { Copy, Check, User, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface ChatMessageProps {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: Date;
  tokens?: { input?: number; output?: number };
  cost?: number;
  isStreaming?: boolean;
}

export function ChatMessage({ 
  role, 
  content, 
  timestamp, 
  tokens, 
  cost,
  isStreaming = false
}: ChatMessageProps) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = React.useCallback(async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [content]);

  const getIcon = () => {
    switch (role) {
      case 'user':
        return <User className="h-5 w-5" />;
      case 'assistant':
        return <Bot className="h-5 w-5" />;
      default:
        return null;
    }
  };

  const renderContent = React.useMemo(() => {
    // Garantir que content nunca seja null ou undefined
    const safeContent = content || '';
    
    if (role === 'user') {
      return <p className="whitespace-pre-wrap">{safeContent}</p>;
    }

    const html = marked(safeContent, { 
      breaks: true,
      gfm: true
    });

    return (
      <div 
        className="markdown-content prose prose-sm dark:prose-invert max-w-none"
        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(html) }}
      />
    );
  }, [role, content]);

  return (
    <div 
      className={cn(
        "group relative mb-6 animate-in fade-in slide-in-from-bottom-2",
        role === 'user' ? "ml-12" : "mr-12"
      )}
    >
      <div className={cn(
        "flex gap-3",
        role === 'user' && "flex-row-reverse"
      )}>
        {/* Avatar */}
        <div className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
          role === 'user' 
            ? "bg-primary text-primary-foreground" 
            : "bg-muted"
        )}>
          {getIcon()}
        </div>

        {/* Message Content */}
        <Card className={cn(
          "flex-1 overflow-hidden",
          isStreaming && "animate-pulse"
        )}>
          <div className="p-4">
            {/* Header */}
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">
                  {role === 'user' ? 'Você' : 'Claude'}
                </span>
                {timestamp && (
                  <span className="text-xs text-muted-foreground">
                    {timestamp.toLocaleTimeString('pt-BR')}
                  </span>
                )}
              </div>

              {/* Actions */}
              {!isStreaming && (
                <div className="opacity-0 transition-opacity group-hover:opacity-100">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleCopy}
                    className="h-8 w-8"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              )}
            </div>

            {/* Content */}
            <div className="text-sm">
              {renderContent}
            </div>

            {/* Footer with metrics */}
            {(tokens || cost) && !isStreaming && (
              <div className="mt-3 flex items-center gap-4 border-t pt-2 text-xs text-muted-foreground">
                {tokens && (
                  <span>
                    Tokens: {tokens.input || 0} in / {tokens.output || 0} out
                  </span>
                )}
                {cost && (
                  <span>Custo: ${cost.toFixed(4)}</span>
                )}
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}