'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { ChatMessage } from './ChatMessage';
import { MessageInput } from './MessageInput';
import { ToolRenderer } from '../generative/ToolRenderer';
import { Button } from '@/components/ui/button';
import { Bot, Trash2, Sparkles, ChevronDown } from 'lucide-react';
import { executeTool } from '@/lib/claude-tools';
import { executeMCPTool } from '@/lib/mcp-tools';
import { getWeatherViaMCP } from '@/lib/mcp-direct';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  tool?: {
    name: string;
    type: string;
    data: any;
    loading?: boolean;
  };
}

export function GenerativeChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  
  // Refs para controle de scroll
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Estados para auto scroll
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [showNewMessageButton, setShowNewMessageButton] = useState(false);
  
  // Funções de scroll
  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ 
      behavior,
      block: 'end' 
    });
  }, []);
  
  const checkIfAtBottom = useCallback(() => {
    if (!scrollContainerRef.current) return true;
    
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const threshold = 100; // pixels de margem
    
    return scrollHeight - scrollTop - clientHeight < threshold;
  }, []);
  
  const handleScroll = useCallback(() => {
    const atBottom = checkIfAtBottom();
    setIsAtBottom(atBottom);
    
    // Mostrar/esconder botão de nova mensagem
    if (!atBottom && messages.length > 0) {
      setShowNewMessageButton(true);
    } else {
      setShowNewMessageButton(false);
    }
  }, [checkIfAtBottom, messages.length]);
  
  const handleSend = async (input: string) => {
    if (!input.trim() || isLoading) return;
    
    console.log('🔵 [DEBUG] === INICIANDO ENVIO DE MENSAGEM ===');
    console.log('🔵 [DEBUG] Mensagem:', input);
    console.log('🔵 [DEBUG] SessionId:', sessionId || 'novo');
    console.log('🔵 [DEBUG] Total mensagens:', messages.length);
    
    // Detecção automática de intenção para ferramentas
    const lowerInput = input.toLowerCase();
    let autoTool = null;
    
    // Detecta solicitações de clima
    if (lowerInput.includes('clima') || lowerInput.includes('tempo') || lowerInput.includes('weather')) {
      const cityMatch = input.match(/(?:em|in|de|para)\s+([A-Za-zÀ-ÿ\s]+?)(?:\?|$|,)/i);
      if (cityMatch) {
        console.log('🔧 [DEBUG] Tool de clima detectada:', cityMatch[1].trim());
        autoTool = { name: 'getWeather', args: cityMatch[1].trim() };
      }
    }
    
    console.log('🔧 [DEBUG] AutoTool detectada?', autoTool ? 'SIM' : 'NÃO');
    
    
    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: input,
      timestamp: new Date().toISOString()
    };
    
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setIsLoading(true);
    
    // Se detectou uma ferramenta automaticamente, executa ela
    if (autoTool) {
      try {
        // Cria mensagem de resposta com tool em loading
        const assistantMessage: Message = {
          id: `msg-${Date.now()}-assistant`,
          role: 'assistant',
          content: ``,
          timestamp: new Date().toISOString(),
          tool: {
            name: autoTool.name,
            type: '',
            data: null,
            loading: true
          }
        };
        
        setMessages(prev => [...prev, assistantMessage]);
        
        // Executa a ferramenta
        let result = null;
        if (autoTool.name === 'getWeather') {
          // Usa MCP direto para clima
          result = await getWeatherViaMCP(autoTool.args);
        } else {
          result = await executeTool(autoTool.name, autoTool.args);
        }
        
        if (result) {
          // Atualiza com o resultado
          setMessages(prev => prev.map(msg => 
            msg.id === assistantMessage.id 
              ? {
                  ...msg,
                  content: ``,
                  tool: {
                    name: autoTool.name,
                    type: result.type,
                    data: result.data,
                    loading: false
                  }
                }
              : msg
          ));
        }
        
        setIsLoading(false);
        return; // Não continua para o Claude
      } catch (error) {
        console.error('Tool execution error:', error);
        setIsLoading(false);
      }
    }
    
    try {
      console.log('📡 [DEBUG] Enviando request para /api/claude/sdk');
      const response = await fetch('/api/claude/sdk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages.map((m, idx) => {
            // Adiciona instruções de tools na primeira mensagem do usuário
            if (idx === 0 && m.role === 'user') {
              return {
                role: m.role,
                content: `[INSTRUÇÕES: Você tem ferramentas disponíveis. Use TOOL:getWeather:cidade para informações sobre o clima]

${m.content}`
              };
            }
            return {
              role: m.role,
              content: m.content
            };
          }),
          sessionId: sessionId || undefined
        })
      });
      
      if (!response.ok) {
        console.error('❌ [DEBUG] Response error:', response.status, response.statusText);
        const errorBody = await response.text();
        console.error('❌ [DEBUG] Error body:', errorBody);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      console.log('✅ [DEBUG] Response OK, iniciando stream...');
      
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';
      let toolPending: { name: string; args: string } | null = null;
      
      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              // Ignora o marcador [DONE]
              if (line === 'data: [DONE]') {
                console.log('✅ [DEBUG] Stream finalizado - [DONE] recebido');
                continue;
              }
              
              try {
                const data = JSON.parse(line.slice(6));
                if (data.type === 'text_chunk') {
                  console.log('📦 [DEBUG] Chunk:', data.content?.substring(0, 50) + '...');
                }
                
                if (data.session_id && !sessionId) {
                  setSessionId(data.session_id);
                }
                
                if (data.type === 'text_chunk' && data.content) {
                  assistantContent += data.content;
                  console.log('📦 [DEBUG] Chunk recebido:', data.content);
                  console.log('📦 [DEBUG] Total acumulado:', assistantContent.length, 'caracteres');
                  
                  // Detecta comandos de tool
                  const toolMatch = assistantContent.match(/TOOL:(\w+):(.+?)(?:\n|$)/);
                  if (toolMatch && !toolPending) {
                    console.log('🔨 [DEBUG] Tool no response:', toolMatch[1], toolMatch[2]);
                    toolPending = {
                      name: toolMatch[1],
                      args: toolMatch[2]
                    };
                  }
                }
              } catch (e) {
                console.warn('⚠️ [DEBUG] Parse error:', e, 'Line:', line);
              }
            }
          }
        }
      }
      
      // Cria mensagem do assistente
      console.log('📝 [DEBUG] Conteúdo final recebido:', assistantContent);
      console.log('📝 [DEBUG] Tamanho:', assistantContent.length, 'caracteres');
      
      const cleanContent = assistantContent.replace(/TOOL:\w+:.+?(?:\n|$)/g, '').trim();
      console.log('📝 [DEBUG] Conteúdo limpo (sem TOOL):', cleanContent);
      
      const assistantMessage: Message = {
        id: `msg-${Date.now()}-assistant`,
        role: 'assistant',
        content: cleanContent,
        timestamp: new Date().toISOString()
      };
      
      console.log('📨 [DEBUG] Mensagem criada:', assistantMessage);
      
      // Se detectou uma tool, executa ela
      if (toolPending) {
        // Adiciona mensagem com tool em loading
        assistantMessage.tool = {
          name: toolPending.name,
          type: '',
          data: null,
          loading: true
        };
        
        setMessages(prev => [...prev, assistantMessage]);
        
        // Executa a tool - tenta MCP primeiro, depois fallback
        const args = toolPending.args.includes('|') 
          ? toolPending.args.split('|') 
          : toolPending.args;
        
        // Tenta usar MCP para clima
        let result = null;
        if (toolPending.name === 'getWeather') {
          result = await executeMCPTool('getWeather', args);
        } else {
          result = await executeTool(toolPending.name, args);
        }
        
        if (result) {
          // Atualiza a mensagem com o resultado da tool
          setMessages(prev => prev.map(msg => 
            msg.id === assistantMessage.id 
              ? {
                  ...msg,
                  tool: {
                    name: toolPending!.name,
                    type: result.type,
                    data: result.data,
                    loading: false
                  }
                }
              : msg
          ));
        }
      } else if (assistantContent) {
        console.log('✅ [DEBUG] Adicionando mensagem (sem tool), conteúdo:', assistantContent);
        setMessages(prev => {
          const newMessages = [...prev, assistantMessage];
          console.log('📨 [DEBUG] Total de mensagens agora:', newMessages.length);
          console.log('📨 [DEBUG] Última mensagem:', newMessages[newMessages.length - 1]);
          return newMessages;
        });
      } else {
        console.log('⚠️ [DEBUG] Nenhum conteúdo do assistente para adicionar!');
      }
    } catch (error) {
      console.error('❌ [DEBUG] === ERRO NO PROCESSAMENTO ===');
      console.error('❌ [DEBUG] Error:', error);
      console.error('❌ [DEBUG] Stack:', error instanceof Error ? error.stack : 'No stack');
    } finally {
      setIsLoading(false);
    }
  };
  
  const clearMessages = () => {
    setMessages([]);
    setSessionId(null);
  };
  
  // Effects para auto scroll
  useEffect(() => {
    // Auto scroll quando novas mensagens chegam (apenas se está no final)
    if (isAtBottom) {
      scrollToBottom();
    }
  }, [messages, isAtBottom, scrollToBottom]);
  
  // Scroll inicial quando componente monta
  useEffect(() => {
    scrollToBottom('instant');
  }, [scrollToBottom]);
  
  // Scroll quando uma nova mensagem do usuário é enviada
  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === 'user') {
        // Sempre scroll para baixo quando usuário envia mensagem
        setIsAtBottom(true);
        scrollToBottom();
      }
    }
  }, [messages, scrollToBottom]);
  
  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => window.location.reload()}
              className="relative hover:opacity-80 transition-opacity"
              title="Recarregar página"
            >
              <Bot className="h-6 w-6 text-primary" />
              <Sparkles className="h-3 w-3 text-yellow-500 absolute -top-1 -right-1" />
            </button>
            <h1 className="text-xl font-semibold">Chat</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={clearMessages}
              title="Limpar conversa"
            >
              <Trash2 className="h-5 w-5" />
            </Button>
          </div>
        </div>
        <div className="border-b bg-muted/30 px-4 py-2">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>💬 {messages.length} {messages.length === 1 ? 'mensagem' : 'mensagens'}</span>

          </div>
        </div>
      </header>
      
      {/* Messages */}
      <div 
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-6"
        style={{
          scrollBehavior: 'smooth',
          WebkitOverflowScrolling: 'touch',
          willChange: 'scroll-position'
        }}
      >
        <div className="mx-auto max-w-4xl space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <Sparkles className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
              <p className="text-muted-foreground mb-6">
                Experimente perguntar sobre clima!
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl mx-auto text-left">
                <button
                  onClick={() => handleSend("Notícias do Brasil e do Mundo Hoje")}
                  className="p-3 border rounded-lg hover:bg-muted/50 transition-colors text-sm font-semibold"
                >
                  Notícias do Brasil e do Mundo Hoje
                </button>
                <button
                  onClick={() => handleSend("Tendências de Insurtech 2025")}
                  className="p-3 border rounded-lg hover:bg-muted/50 transition-colors text-sm font-semibold"
                >
                  Tendências de Insurtech 2025
                </button>
                <button
                  onClick={() => handleSend("CEO da SUTHUB Renato Ferreira LinkedIn")}
                  className="p-3 border rounded-lg hover:bg-muted/50 transition-colors text-sm font-semibold"
                >
                  CEO da SUTHUB Renato Ferreira LinkedIn
                </button>
                <button
                  onClick={() => handleSend("Qual é o clima em Nova York?")}
                  className="p-3 border rounded-lg hover:bg-muted/50 transition-colors text-sm font-semibold"
                >
                  Qual é o clima em Nova York?
                </button>
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <div key={message.id} className="space-y-2">
                {/* Se é mensagem do assistente com ferramenta de clima, não mostra a mensagem */}
                {!(message.role === 'assistant' && message.tool?.name === 'getWeather') && (
                  <ChatMessage 
                    role={message.role}
                    content={message.content}
                    timestamp={new Date(message.timestamp)}
                  />
                )}
                {message.tool && (
                  <div className={message.role === 'assistant' && message.tool?.name === 'getWeather' ? "" : "ml-12 animate-in fade-in slide-in-from-bottom-2"}>
                    <ToolRenderer
                      type={message.tool.type}
                      data={message.tool.data}
                      loading={message.tool.loading}
                    />
                  </div>
                )}
              </div>
            ))
          )}
          {isLoading && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <div className="animate-pulse">Aguarde um momento, estou pensando...</div>
            </div>
          )}
          
          {/* Âncora invisível para scroll */}
          <div ref={messagesEndRef} />
        </div>
      </div>
      
      {/* Botão flutuante de nova mensagem */}
      {showNewMessageButton && (
        <button
          onClick={() => {
            scrollToBottom();
            setIsAtBottom(true);
          }}
          className="absolute bottom-24 right-6 bg-primary text-primary-foreground rounded-full p-3 shadow-lg hover:shadow-xl transition-all duration-200"
          title="Ir para última mensagem"
        >
          <ChevronDown className="h-5 w-5" />
        </button>
      )}
      
      {/* Input */}
      <MessageInput
        onSendMessage={handleSend}
        disabled={isLoading}
        isStreaming={isLoading}
        placeholder="Pergunte sobre clima na sua cidade..."
      />
    </div>
  );
}