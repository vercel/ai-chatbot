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
  streamingSpeed?: number;
  onStreamComplete?: () => void;
}

export function ChatMessage({ 
  role, 
  content, 
  timestamp, 
  tokens, 
  cost,
  isStreaming = false,
  streamingSpeed = 30,
  onStreamComplete
}: ChatMessageProps) {
  const [copied, setCopied] = React.useState(false);
  const [displayedContent, setDisplayedContent] = React.useState('');
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const intervalRef = React.useRef<NodeJS.Timeout | null>(null);
  const hasCompletedRef = React.useRef(false);

  // Reset quando streaming muda
  React.useEffect(() => {
    if (!isStreaming) {
      hasCompletedRef.current = false;
    }
  }, [isStreaming]);

  // Efeito para streaming
  React.useEffect(() => {
    // Se não é streaming ou já completou, mostra tudo
    if (!isStreaming || role === 'user') {
      setDisplayedContent(content);
      if (!isStreaming) {
        hasCompletedRef.current = false;
      }
      return;
    }

    // Se já completou anteriormente, mostra tudo instantaneamente
    if (hasCompletedRef.current) {
      setDisplayedContent(content);
      return;
    }

    // Reset para novo streaming
    setDisplayedContent('');
    setCurrentIndex(0);

    // Calcula o intervalo baseado na velocidade
    const interval = 1000 / streamingSpeed;

    // Inicia o streaming
    intervalRef.current = setInterval(() => {
      setCurrentIndex(prev => {
        const next = prev + 1;
        
        if (next >= content.length) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          hasCompletedRef.current = true;
          if (onStreamComplete) {
            setTimeout(onStreamComplete, 0);
          }
          return content.length;
        }
        
        return next;
      });
    }, interval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [content, isStreaming, role, streamingSpeed, onStreamComplete]);

  // Atualiza o conteúdo exibido
  React.useEffect(() => {
    if (isStreaming && role === 'assistant' && currentIndex > 0 && currentIndex <= content.length) {
      setDisplayedContent(content.slice(0, currentIndex));
    } else if (!isStreaming || hasCompletedRef.current) {
      setDisplayedContent(content);
    }
  }, [currentIndex, content, isStreaming, role]);

  const handleCopy = React.useCallback(async () => {
    await navigator.clipboard.writeText(displayedContent || content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [displayedContent, content]);

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
    // Usa displayedContent se estiver definido (durante streaming)
    const contentToShow = displayedContent || content || '';
    
    if (role === 'user') {
      return <p className="whitespace-pre-wrap">{contentToShow}</p>;
    }

    const html = marked(contentToShow, { 
      breaks: true,
      gfm: true
    });

    return (
      <>
        <div 
          className="markdown-content prose prose-sm dark:prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(html) }}
        />
        {/* Cursor piscante durante streaming */}
        {isStreaming && role === 'assistant' && currentIndex < content.length && (
          <span className="inline-block w-0.5 h-4 bg-gray-600 animate-pulse ml-0.5" />
        )}
      </>
    );
  }, [role, content, displayedContent, isStreaming, currentIndex]);

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
          "flex-1 overflow-hidden"
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