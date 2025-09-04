'use client';

import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Markdown } from './markdown';

interface StreamingMarkdownProps {
  content: string;
  isUser?: boolean;
  isStreaming?: boolean;
  onStreamComplete?: () => void;
  className?: string;
  speed?: number; // Nova prop para controlar velocidade
}

export function StreamingMarkdown({
  content,
  isUser = false,
  isStreaming = false,
  onStreamComplete,
  className,
  speed = 100 // Valor padrão mais lento
}: StreamingMarkdownProps) {
  const [displayedContent, setDisplayedContent] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isStreamingRef = useRef(false);

  // Usa a velocidade configurada ou valores padrão
  // Velocidade invertida: valores menores = mais rápido
  const calculateTypeSpeed = () => {
    if (!speed) return isUser ? 20 : 40;
    
    // Mapeia o range do slider (10-200) para velocidade real (5-200ms)
    // Invertido: slider baixo = rápido, slider alto = lento  
    // Aumentando o range para permitir velocidades mais lentas
    const mappedSpeed = Math.floor((200 - speed) * 1.5) + 5;
    return Math.min(Math.max(mappedSpeed, 5), 200);
  };
  
  const typeSpeed = calculateTypeSpeed();

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
        {isUser ? (
          displayedContent
        ) : (
          <Markdown>{displayedContent}</Markdown>
        )}
        {showCursor && (
          <span className="animate-pulse inline-block w-[2px] h-4 ml-[1px] bg-current align-middle" />
        )}
      </div>
    </div>
  );
}