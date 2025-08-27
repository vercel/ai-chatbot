'use client';

import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface StreamingMarkdownProps {
  content: string;
  isUser?: boolean;
  isStreaming?: boolean;
  onStreamComplete?: () => void;
  className?: string;
}

export function StreamingMarkdown({
  content,
  isUser = false,
  isStreaming = false,
  onStreamComplete,
  className
}: StreamingMarkdownProps) {
  const [displayedContent, setDisplayedContent] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isStreamingRef = useRef(false);

  // Velocidade de digitação: 10ms para usuário, 20ms para assistente
  const typeSpeed = isUser ? 10 : 20;

  useEffect(() => {
    // Limpa quando o conteúdo muda completamente
    if (!isStreaming && content !== displayedContent) {
      setDisplayedContent(content);
      setCurrentIndex(content.length);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Se não está em streaming, mostra tudo
    if (!isStreaming) {
      setDisplayedContent(content);
      return;
    }

    // Inicia streaming apenas uma vez
    if (isStreamingRef.current) return;
    isStreamingRef.current = true;

    // Reseta o estado para streaming
    setDisplayedContent('');
    setCurrentIndex(0);

    // Limpa intervalo anterior
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Cria novo intervalo para animação de digitação
    intervalRef.current = setInterval(() => {
      setCurrentIndex(prev => {
        const nextIndex = prev + 1;
        
        // Se chegou ao fim
        if (nextIndex > content.length) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          isStreamingRef.current = false;
          if (onStreamComplete) {
            onStreamComplete();
          }
          return prev;
        }
        
        // Atualiza o conteúdo exibido
        setDisplayedContent(content.slice(0, nextIndex));
        return nextIndex;
      });
    }, typeSpeed);

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      isStreamingRef.current = false;
    };
  }, [content, isStreaming, isUser, typeSpeed, onStreamComplete]);

  // Adiciona cursor piscante durante streaming
  const showCursor = isStreaming && currentIndex < content.length;

  return (
    <div className={cn('relative', className)}>
      <div className="whitespace-pre-wrap break-words">
        {displayedContent}
        {showCursor && (
          <span className="animate-pulse inline-block w-[2px] h-4 ml-[1px] bg-current align-middle" />
        )}
      </div>
    </div>
  );
}