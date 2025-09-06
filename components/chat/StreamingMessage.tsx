'use client';

import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';

interface StreamingMessageProps {
  content: string;
  isStreaming?: boolean;
  onStreamComplete?: () => void;
  speed?: number; // caracteres por segundo
}

export function StreamingMessage({ 
  content, 
  isStreaming = true,
  onStreamComplete,
  speed = 30 // 30 caracteres por segundo (ajustável)
}: StreamingMessageProps) {
  const [displayedContent, setDisplayedContent] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isStreaming) {
      setDisplayedContent(content);
      return;
    }

    // Reset quando o conteúdo muda
    setDisplayedContent('');
    setCurrentIndex(0);

    // Calcula o intervalo baseado na velocidade desejada
    const interval = 1000 / speed; // ms por caractere

    // Inicia o streaming simulado
    intervalRef.current = setInterval(() => {
      setCurrentIndex(prev => {
        const next = prev + 1;
        
        // Se chegou ao fim
        if (next >= content.length) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          if (onStreamComplete) {
            onStreamComplete();
          }
          return content.length;
        }
        
        return next;
      });
    }, interval);

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [content, isStreaming, speed, onStreamComplete]);

  // Atualiza o conteúdo exibido quando o índice muda
  useEffect(() => {
    setDisplayedContent(content.slice(0, currentIndex));
  }, [currentIndex, content]);

  return (
    <div className="streaming-message">
      {/* Wrapper div com classes ao invés de passar className direto */}
      <div className="prose prose-sm max-w-none">
        <ReactMarkdown>
          {displayedContent}
        </ReactMarkdown>
      </div>
      
      {/* Cursor piscante durante streaming */}
      {isStreaming && currentIndex < content.length && (
        <span className="inline-block w-0.5 h-4 bg-gray-600 animate-pulse ml-0.5" />
      )}
    </div>
  );
}