'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useClaudeSDK } from '@/hooks/use-claude-sdk';
import { StreamingMarkdown } from './streaming-markdown';
import '@/styles/slider.css';

export function ClaudeChat() {
  const { messages, sendMessage, clearMessages, isLoading, sessionId } = useClaudeSDK();
  const [input, setInput] = useState('');
  const [streamSpeed, setStreamSpeed] = useState(100); // Valor padrão fixo para evitar hydration mismatch
  const [isMounted, setIsMounted] = useState(false);

  // Carrega a velocidade salva apenas no cliente após a montagem
  useEffect(() => {
    setIsMounted(true);
    const savedSpeed = localStorage.getItem('streamSpeed');
    if (savedSpeed) {
      setStreamSpeed(parseInt(savedSpeed));
    }
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    
    const message = input;
    setInput('');
    await sendMessage(message, { streamSpeed });
  };

  const handleSpeedChange = (newSpeed: number) => {
    setStreamSpeed(newSpeed);
    localStorage.setItem('streamSpeed', newSpeed.toString());
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-lg font-semibold">Claude Code SDK Chat</h2>
        <div className="flex items-center gap-4">
          {/* Slider de Velocidade Personalizado */}
          <div className="speed-control">
            <span className={`text-sm ${isMounted && streamSpeed > 100 ? 'speed-emoji-slow' : ''}`}>
              🐢
            </span>
            <div className="relative">
              <input
                type="range"
                min="10"
                max="200"
                value={streamSpeed}
                onChange={(e) => handleSpeedChange(parseInt(e.target.value))}
                className="speed-slider"
                data-speed={isMounted ? (streamSpeed > 100 ? 'slow' : streamSpeed < 50 ? 'fast' : 'normal') : 'normal'}
              />
              <div className="speed-indicator">
                {isMounted ? (
                  streamSpeed < 30 ? 'Ultra Rápido' :
                  streamSpeed < 70 ? 'Rápido' :
                  streamSpeed < 120 ? 'Normal' :
                  streamSpeed < 170 ? 'Lento' : 'Ultra Lento'
                ) : 'Normal'}
                <br />
                <span className="text-xs opacity-75">{isMounted ? `${streamSpeed}ms` : '100ms'}</span>
              </div>
            </div>
            <span className={`text-sm ${isMounted && streamSpeed < 50 ? 'speed-emoji-fast' : ''}`}>
              🚀
            </span>
          </div>
          {sessionId && (
            <span className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded">
              Sessão: {sessionId.slice(0, 8)}...
            </span>
          )}
          <button
            onClick={clearMessages}
            className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded"
          >
            Limpar
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 mt-8">
            <p>💬 Chat direto com Claude Code SDK</p>
            <p className="text-sm mt-2">Sem necessidade de API keys!</p>
          </div>
        )}
        
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${
              message.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-[70%] rounded-lg px-4 py-2 ${
                message.role === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100'
              }`}
            >
              {message.role === 'user' ? (
                <p>{message.content}</p>
              ) : (
                <StreamingMarkdown
                  content={message.content}
                  isStreaming={isLoading && index === messages.length - 1}
                  speed={streamSpeed}
                />
              )}
            </div>
          </div>
        ))}
        
        {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg px-4 py-2">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-100"></div>
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-200"></div>
              </div>
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="p-4 border-t">
        <div className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Digite sua mensagem..."
            className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                <div className="w-2 h-2 bg-white rounded-full animate-pulse delay-75"></div>
                <div className="w-2 h-2 bg-white rounded-full animate-pulse delay-150"></div>
              </div>
            ) : (
              'Enviar'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}