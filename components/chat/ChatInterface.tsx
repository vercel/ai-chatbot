'use client';

import React from 'react';
import { ChatMessage } from './ChatMessage';
import { MessageInput } from './MessageInput';
import { SessionTabs } from '../session/SessionTabs';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Settings, Download, RefreshCw, Trash2, Bot, Clock, DollarSign, Activity, ArrowDown } from 'lucide-react';
import useChatStore from '@/lib/stores/chatStore';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

interface ChatInterfaceProps {
  sessionData?: any;
  readOnly?: boolean;
}

export function ChatInterface({
  sessionData,
  readOnly = false,
}: ChatInterfaceProps = {}) {
  const router = useRouter();
  const {
    sessions,
    activeSessionId,
    isStreaming,
    streamingContent,
    isProcessing,
    createSession,
    deleteSession,
    setActiveSession,
    addMessage,
    setStreaming,
    setStreamingContent,
    appendStreamingContent,
    setProcessing,
    updateMetrics,
    getActiveSession,
    clearSession,
    loadExternalSession,
  } = useChatStore();

  const [isUserScrolling, setIsUserScrolling] = React.useState(false);
  const [autoScrollEnabled, setAutoScrollEnabled] = React.useState(true);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const messagesContainerRef = React.useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const activeSession = getActiveSession();
  const sessionList = Array.from(sessions.values());

  // Sistema inteligente de auto-scroll
  const scrollToBottom = React.useCallback((behavior: ScrollBehavior = "smooth") => {
    if (!autoScrollEnabled || isUserScrolling) return;
    
    requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ 
        behavior, 
        block: "end",
        inline: "nearest" 
      });
    });
  }, [autoScrollEnabled, isUserScrolling]);

  // Detecta quando usuário está rolando manualmente
  const handleScroll = React.useCallback(() => {
    if (!messagesContainerRef.current) return;
    
    const container = messagesContainerRef.current;
    const { scrollTop, scrollHeight, clientHeight } = container;
    const distanceFromBottom = scrollHeight - (scrollTop + clientHeight);
    
    const userIsScrolling = distanceFromBottom > 100;
    
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    
    if (userIsScrolling) {
      setIsUserScrolling(true);
      setAutoScrollEnabled(false);
    } else {
      scrollTimeoutRef.current = setTimeout(() => {
        setIsUserScrolling(false);
        setAutoScrollEnabled(true);
      }, 100);
    }
  }, []);

  // Auto-scroll quando houver novas mensagens
  React.useEffect(() => {
    if (autoScrollEnabled && !isUserScrolling) {
      const timeoutId = setTimeout(() => {
        scrollToBottom("smooth");
      }, 50);
      
      return () => clearTimeout(timeoutId);
    }
  }, [activeSession?.messages, streamingContent, scrollToBottom, autoScrollEnabled, isUserScrolling]);

  // Força scroll quando iniciar streaming
  React.useEffect(() => {
    if (isStreaming) {
      setAutoScrollEnabled(true);
      setIsUserScrolling(false);
      scrollToBottom("auto");
    }
  }, [isStreaming, scrollToBottom]);

  // Carregar sessão externa
  React.useEffect(() => {
    if (sessionData && sessionData.messages) {
      loadExternalSession(sessionData);
    }
  }, [sessionData, loadExternalSession]);

  // Carregar histórico de demonstração na primeira vez
  React.useEffect(() => {
    // Converter Map para array
    const sessionList = sessions instanceof Map ? Array.from(sessions.values()) : 
                       Array.isArray(sessions) ? sessions : [];
    
    // Verificar se já existe uma sessão demo
    const demoSession = sessionList.find(s => s.id === 'demo-session-001');
    
    if (!demoSession && sessionList.length === 0) {
      // Criar sessão de demonstração
      const demoId = 'demo-session-001';
      
      // Criar a sessão usando importSession que permite ID customizado
      const demoSessionData = {
        id: demoId,
        title: '🎯 Conversa de Teste Bem-Sucedida',
        messages: [],
        config: {
          systemPrompt: '',
          allowedTools: [],
          maxTurns: 20,
          permissionMode: 'acceptEdits' as const,
          cwd: undefined
        },
        createdAt: new Date('2025-09-04T10:30:00'),
        updatedAt: new Date('2025-09-04T10:32:00'),
        metrics: {
          totalTokens: 0,
          totalCost: 0,
          messageCount: 6
        }
      };
      
      // Importar sessão com ID customizado
      if (typeof useChatStore.getState().importSession === 'function') {
        useChatStore.getState().importSession(demoSessionData);
      }
      
      // Adicionar o histórico de conversas
      const demoMessages = [
        {
          id: 'msg-1',
          role: 'user' as const,
          content: 'Olá Claude, qual é a capital do Brasil?',
          timestamp: new Date('2025-09-04T10:30:00').toISOString()
        },
        {
          id: 'msg-2',
          role: 'assistant' as const,
          content: 'Brasília é a capital do Brasil.',
          timestamp: new Date('2025-09-04T10:30:05').toISOString()
        },
        {
          id: 'msg-3',
          role: 'user' as const,
          content: 'Quanto é 10 multiplicado por 20?',
          timestamp: new Date('2025-09-04T10:31:00').toISOString()
        },
        {
          id: 'msg-4',
          role: 'assistant' as const,
          content: '10 multiplicado por 20 é igual a 200.',
          timestamp: new Date('2025-09-04T10:31:03').toISOString()
        },
        {
          id: 'msg-5',
          role: 'user' as const,
          content: 'Diga apenas SIM se você está funcionando',
          timestamp: new Date('2025-09-04T10:32:00').toISOString()
        },
        {
          id: 'msg-6',
          role: 'assistant' as const,
          content: 'SIM',
          timestamp: new Date('2025-09-04T10:32:02').toISOString()
        }
      ];
      
      // Adicionar cada mensagem
      demoMessages.forEach(msg => {
        addMessage(demoId, {
          ...msg,
          timestamp: new Date(msg.timestamp)
        } as any);
      });
      
      // Definir como sessão ativa
      setActiveSession(demoId);
    }
  }, []);

  const handleNewSession = () => {
    const sessionId = createSession();
    setActiveSession(sessionId);
  };

  const handleSendMessage = async (content: string) => {
    if (isStreaming) return;
    
    setIsUserScrolling(false);
    setAutoScrollEnabled(true);

    let currentSessionId = activeSessionId;

    if (!currentSessionId) {
      currentSessionId = createSession();
      setActiveSession(currentSessionId);
    }

    // Adiciona mensagem do usuário
    addMessage(currentSessionId, {
      role: "user",
      content,
      timestamp: new Date(),
    });

    // Inicia streaming
    setStreaming(true);
    setStreamingContent("");
    setProcessing(true);

    try {
      // Chama a API de chat
      const response = await fetch('/api/claude/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: content,
          sessionId: currentSessionId,
        }),
      });

      if (!response.ok) {
        throw new Error('Erro na resposta da API');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                
                if (data.type === 'text_chunk' || data.type === 'assistant_text') {
                  if (data.content) {
                    appendStreamingContent(data.content);
                    assistantContent += data.content;
                  }
                  if (isProcessing) {
                    setProcessing(false);
                  }
                } else if (data.type === 'result') {
                  // Adiciona mensagem completa do assistente
                  if (assistantContent) {
                    addMessage(currentSessionId, {
                      role: "assistant",
                      content: assistantContent,
                      timestamp: new Date(),
                      tokens: {
                        input: data.input_tokens,
                        output: data.output_tokens,
                      },
                      cost: data.cost_usd,
                    });
                  }

                  // Atualiza métricas
                  if (data.input_tokens || data.output_tokens || data.cost_usd) {
                    updateMetrics(
                      currentSessionId,
                      { input: data.input_tokens || 0, output: data.output_tokens || 0 },
                      data.cost_usd || 0
                    );
                  }
                }
              } catch (e) {
                console.error('Erro ao processar chunk:', e);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
    } finally {
      setStreaming(false);
      setStreamingContent("");
      setProcessing(false);
    }
  };

  const handleInterrupt = async () => {
    try {
      await fetch('/api/claude/interrupt', {
        method: 'POST',
      });
      setStreaming(false);
      setStreamingContent("");
      setProcessing(false);
    } catch (error) {
      console.error('Erro ao interromper:', error);
      setStreaming(false);
      setStreamingContent("");
      setProcessing(false);
    }
  };

  const handleExportSession = () => {
    if (!activeSession) return;

    const dataStr = JSON.stringify(activeSession, null, 2);
    const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);
    const exportFileDefaultName = `chat-session-${activeSession.id}.json`;

    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", exportFileDefaultName);
    linkElement.click();
  };

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <a
              href="/"
              className="flex items-center gap-3 hover:opacity-80 transition-opacity"
            >
              <Bot className="h-6 w-6 text-primary" />
              <div className="flex flex-col">
                <h1 className="text-xl font-semibold">Claude Chat</h1>
              </div>
            </a>
          </div>

          <div className="flex items-center gap-2">
            {readOnly && (
              <div className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                Modo Somente Leitura
              </div>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleExportSession}
              disabled={!activeSession}
              title="Exportar sessão"
            >
              <Download className="h-5 w-5" />
            </Button>

            {!readOnly && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => window.location.reload()}
                title="Atualizar página"
              >
                <RefreshCw className="h-5 w-5" />
              </Button>
            )}

            <Button
              variant="ghost"
              size="icon"
              onClick={() => console.log("Configurações em desenvolvimento")}
              title="Configurações"
            >
              <Settings className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Session Tabs */}
        <SessionTabs
          sessions={sessionList}
          activeSessionId={activeSessionId}
          onSessionSelect={setActiveSession}
          onSessionClose={deleteSession}
          onNewSession={handleNewSession}
        />
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        <div className="flex flex-1 flex-col">
          {/* Messages */}
          {activeSession ? (
            <div 
              ref={messagesContainerRef}
              onScroll={handleScroll}
              className="flex-1 overflow-y-auto px-4 py-6"
            >
              <div className="mx-auto max-w-4xl">
                {activeSession?.messages.length === 0 && !isStreaming && (
                  <Card className="p-8 text-center">
                    <Bot className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h2 className="mt-4 text-lg font-medium">
                      Comece uma conversa
                    </h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Digite uma mensagem abaixo para iniciar
                    </p>
                  </Card>
                )}

                {activeSession?.messages.map((message) => (
                  <ChatMessage
                    key={message.id}
                    role={message.role}
                    content={message.content}
                    timestamp={message.timestamp}
                    tokens={message.tokens}
                    cost={message.cost}
                  />
                ))}

                {isProcessing && !streamingContent && (
                  <div className="flex items-center justify-start mb-6">
                    <div className="flex gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
                        <Bot className="h-5 w-5" />
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Processando resposta...
                      </div>
                    </div>
                  </div>
                )}

                {isStreaming && streamingContent && (
                  <ChatMessage
                    role="assistant"
                    content={streamingContent}
                    isStreaming
                  />
                )}

                <div ref={messagesEndRef} />
                
                {/* Botão de scroll para baixo */}
                {isUserScrolling && (
                  <div className="fixed bottom-24 right-6 z-50 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <Button
                      onClick={() => {
                        setIsUserScrolling(false);
                        setAutoScrollEnabled(true);
                        scrollToBottom("smooth");
                      }}
                      size="icon"
                      className="rounded-full shadow-lg"
                      title="Voltar ao final"
                    >
                      <ArrowDown className="h-5 w-5" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto px-4 py-6">
              <div className="mx-auto max-w-4xl">
                <Card className="p-8 text-center">
                  <Bot className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h2 className="mt-4 text-lg font-medium">
                    Nenhuma sessão ativa
                  </h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Crie uma nova sessão para começar
                  </p>
                </Card>
              </div>
            </div>
          )}

          {/* Session Actions */}
          {activeSession && (
            <div className="border-t px-4 py-2">
              <div className="mx-auto flex max-w-4xl items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <Activity className="h-3 w-3" />
                    {activeSession.messages.length} mensagens
                  </span>
                  <span className="flex items-center gap-1">
                    {activeSession.metrics.totalTokens.toLocaleString()} tokens
                  </span>
                  {activeSession.metrics.totalCost > 0 && (
                    <span className="flex items-center gap-1">
                      <DollarSign className="h-3 w-3" />
                      ${activeSession.metrics.totalCost.toFixed(4)}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {!readOnly && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (activeSessionId) {
                          deleteSession(activeSessionId);
                        }
                      }}
                      disabled={isStreaming}
                    >
                      <Trash2 className="mr-2 h-3 w-3" />
                      Deletar
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Message Input */}
          {!readOnly && (
            <MessageInput
              onSendMessage={handleSendMessage}
              onInterrupt={handleInterrupt}
              isStreaming={isStreaming}
              disabled={!activeSessionId}
            />
          )}
        </div>
      </div>
    </div>
  );
}