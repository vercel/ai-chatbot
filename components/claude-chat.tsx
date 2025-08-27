'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useClaudeSDK } from '@/hooks/use-claude-sdk';
import { StreamingMarkdown } from './streaming-markdown';
import '@/styles/slider.css';

interface ClaudeChatProps {
  sessionId?: string;
}

export function ClaudeChat({ sessionId: initialSessionId }: ClaudeChatProps = {}) {
  const { messages, sendMessage, clearMessages, isLoading, sessionId } = useClaudeSDK(initialSessionId);
  const [input, setInput] = useState('');
  const [streamSpeed, setStreamSpeed] = useState(100); // Valor padrão fixo para evitar hydration mismatch
  const [isMounted, setIsMounted] = useState(false);
  const [copyTooltip, setCopyTooltip] = useState(false);
  const [shareTooltip, setShareTooltip] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false); // Inicialmente fechada em mobile
  const [visibility, setVisibility] = useState<'private' | 'public'>('private');
  const [recentSessions, setRecentSessions] = useState<Array<{id: string, title: string, date: string}>>([]);

  // Carrega a velocidade salva e sessões recentes após a montagem
  useEffect(() => {
    setIsMounted(true);
    const savedSpeed = localStorage.getItem('streamSpeed');
    if (savedSpeed) {
      setStreamSpeed(parseInt(savedSpeed));
    }
    
    // Carrega sessões recentes do localStorage
    const savedSessions = localStorage.getItem('claudeRecentSessions');
    if (savedSessions) {
      try {
        setRecentSessions(JSON.parse(savedSessions));
      } catch {}
    }
    
    // Define sidebar aberta por padrão em desktop
    if (window.innerWidth >= 768) {
      setSidebarOpen(true);
    }
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    
    const message = input;
    setInput('');
    
    // Se tem sessionId e é a primeira mensagem, atualiza a URL
    if (sessionId && messages.length === 0 && !initialSessionId) {
      const shortId = sessionId.substring(0, 8);
      window.history.replaceState({}, '', `/claude/${shortId}`);
    }
    
    await sendMessage(message, { streamSpeed });
  };

  const handleSpeedChange = (newSpeed: number) => {
    setStreamSpeed(newSpeed);
    localStorage.setItem('streamSpeed', newSpeed.toString());
  };

  const handleCopySessionId = () => {
    if (sessionId) {
      navigator.clipboard.writeText(sessionId);
      setCopyTooltip(true);
      setTimeout(() => setCopyTooltip(false), 2000);
    }
  };

  const handleShareLink = () => {
    if (sessionId) {
      const shortId = sessionId.substring(0, 8);
      const shareUrl = `${window.location.origin}/claude/${shortId}`;
      navigator.clipboard.writeText(shareUrl);
      setShareTooltip(true);
      setTimeout(() => setShareTooltip(false), 2000);
    }
  };

  // Salva sessão atual no histórico quando há mensagens
  useEffect(() => {
    if (sessionId && messages.length > 0) {
      const currentSession = {
        id: sessionId,
        title: messages[0]?.content?.substring(0, 30) + '...' || 'Nova conversa',
        date: new Date().toISOString()
      };
      
      setRecentSessions(prev => {
        const filtered = prev.filter(s => s.id !== sessionId);
        const updated = [currentSession, ...filtered].slice(0, 10); // Mantém últimas 10
        localStorage.setItem('claudeRecentSessions', JSON.stringify(updated));
        return updated;
      });
    }
  }, [sessionId, messages]);

  return (
    <div className="flex h-full relative">
      {/* Sidebar */}
      <div className={`absolute md:relative z-20 h-full bg-gray-50 border-r transition-all duration-300 ${
        sidebarOpen ? 'w-64 translate-x-0' : 'w-0 -translate-x-64 md:translate-x-0'
      }`}>
        <div className="p-4 h-full overflow-y-auto">
          <h3 className="font-semibold mb-4">Sessões Recentes</h3>
          {recentSessions.length === 0 ? (
            <p className="text-sm text-gray-500">Nenhuma sessão ainda</p>
          ) : (
            <div className="space-y-2">
              {recentSessions.map((session) => (
                <button
                  key={session.id}
                  onClick={() => {
                    const shortId = session.id.substring(0, 8);
                    window.location.href = `/claude/${shortId}`;
                  }}
                  className={`w-full text-left p-2 rounded hover:bg-gray-100 text-sm ${
                    session.id === sessionId ? 'bg-gray-200' : ''
                  }`}
                >
                  <div className="font-medium truncate">{session.title}</div>
                  <div className="text-xs text-gray-500">
                    {new Date(session.date).toLocaleDateString()}
                  </div>
                </button>
              ))}
            </div>
          )}
          
          <div className="mt-6 pt-4 border-t">
            <button
              onClick={() => {
                clearMessages();
                window.location.href = '/claude';
              }}
              className="w-full p-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Nova Conversa
            </button>
          </div>
        </div>
      </div>
      
      {/* Overlay para mobile */}
      {sidebarOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-10"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          {/* Botão Toggle Sidebar */}
          <button
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 md:px-2 md:h-fit"
            data-testid="sidebar-toggle-button"
            data-state={sidebarOpen ? "open" : "closed"}
            onClick={() => setSidebarOpen(!sidebarOpen)}
            title="Toggle Sidebar"
          >
            <svg height="16" strokeLinejoin="round" viewBox="0 0 16 16" width="16" style={{ color: 'currentcolor' }}>
              <path fillRule="evenodd" clipRule="evenodd" d="M6.245 2.5H14.5V12.5C14.5 13.0523 14.0523 13.5 13.5 13.5H6.245V2.5ZM4.995 2.5H1.5V12.5C1.5 13.0523 1.94772 13.5 2.5 13.5H4.995V2.5ZM0 1H1.5H14.5H16V2.5V12.5C16 13.8807 14.8807 15 13.5 15H2.5C1.11929 15 0 13.8807 0 12.5V2.5V1Z" fill="currentColor" />
            </svg>
          </button>
          
          <h2 className="text-lg font-semibold">Claude Code SDK Chat</h2>
        </div>
        <div className="flex items-center gap-4">
          {/* Botão de Visibilidade (Private/Public) */}
          <button
            className="items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 w-fit data-[state=open]:bg-accent data-[state=open]:text-accent-foreground order-1 md:order-3 hidden md:flex md:px-2 md:h-[34px]"
            data-testid="visibility-selector"
            type="button"
            onClick={() => setVisibility(visibility === 'private' ? 'public' : 'private')}
            title={`Modo: ${visibility === 'private' ? 'Privado' : 'Público'}`}
          >
            <svg height="16" strokeLinejoin="round" viewBox="0 0 16 16" width="16" style={{ color: 'currentcolor' }}>
              <path fillRule="evenodd" clipRule="evenodd" d="M10 4.5V6H6V4.5C6 3.39543 6.89543 2.5 8 2.5C9.10457 2.5 10 3.39543 10 4.5ZM4.5 6V4.5C4.5 2.567 6.067 1 8 1C9.933 1 11.5 2.567 11.5 4.5V6H12.5H14V7.5V12.5C14 13.8807 12.8807 15 11.5 15H4.5C3.11929 15 2 13.8807 2 12.5V7.5V6H3.5H4.5ZM11.5 7.5H10H6H4.5H3.5V12.5C3.5 13.0523 3.94772 13.5 4.5 13.5H11.5C12.0523 13.5 12.5 13.0523 12.5 12.5V7.5H11.5Z" fill="currentColor" />
            </svg>
            <span>{visibility === 'private' ? 'Private' : 'Public'}</span>
            <svg height="16" strokeLinejoin="round" viewBox="0 0 16 16" width="16" style={{ color: 'currentcolor' }}>
              <path fillRule="evenodd" clipRule="evenodd" d="M12.0607 6.74999L11.5303 7.28032L8.7071 10.1035C8.31657 10.4941 7.68341 10.4941 7.29288 10.1035L4.46966 7.28032L3.93933 6.74999L4.99999 5.68933L5.53032 6.21966L7.99999 8.68933L10.4697 6.21966L11 5.68933L12.0607 6.74999Z" fill="currentColor" />
            </svg>
          </button>
          
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
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded">
                Sessão: {sessionId.slice(0, 8)}...
              </span>
              <button
                onClick={handleCopySessionId}
                className="relative p-1 hover:bg-gray-100 rounded transition-colors"
                title={`Copiar ID completo: ${sessionId}`}
              >
                <span className="text-sm">📋</span>
                {copyTooltip && (
                  <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                    ID Copiado!
                  </span>
                )}
              </button>
              <button
                onClick={handleShareLink}
                className="relative p-1 hover:bg-gray-100 rounded transition-colors"
                title={`Compartilhar link curto: /claude/${sessionId?.slice(0, 8)}`}
              >
                <span className="text-sm">🔗</span>
                {shareTooltip && (
                  <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                    Link Copiado!
                  </span>
                )}
              </button>
            </div>
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
          <div className="max-w-3xl mx-auto md:mt-20 px-8 size-full flex flex-col justify-center">
            <div className="text-2xl font-semibold" style={{ opacity: 1, transform: 'none' }}>
              Hello there!
            </div>
            <div className="text-2xl text-zinc-500" style={{ opacity: 1, transform: 'none' }}>
              How can I help you today?
            </div>
            <div className="text-center text-gray-400 mt-8">
              <p className="text-sm">💬 Chat direto com Claude Code SDK</p>
              <p className="text-xs mt-1">Sem necessidade de API keys!</p>
            </div>
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
    </div>
  );
}