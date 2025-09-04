'use client';

import React from 'react';
import { ChatMessage } from './ChatMessage';
import { MessageInput } from './MessageInput';
import { ToolRenderer } from '../generative/ToolRenderer';
import { Button } from '@/components/ui/button';
import { Bot, Trash2, Sparkles } from 'lucide-react';
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
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [sessionId, setSessionId] = React.useState<string | null>(null);
  
  const handleSend = async (input: string) => {
    if (!input.trim() || isLoading) return;
    
    // Detecção automática de intenção para ferramentas
    const lowerInput = input.toLowerCase();
    let autoTool = null;
    
    // Detecta solicitações de clima
    if (lowerInput.includes('clima') || lowerInput.includes('tempo') || lowerInput.includes('weather')) {
      const cityMatch = input.match(/(?:em|in|de|para)\s+([A-Za-zÀ-ÿ\s]+?)(?:\?|$|,)/i);
      if (cityMatch) {
        autoTool = { name: 'getWeather', args: cityMatch[1].trim() };
      }
    }
    
    // Detecta solicitações de cálculo
    if (lowerInput.includes('quanto') || lowerInput.includes('calcul')) {
      const mathMatch = input.match(/(\d+[\s\+\-\*\/\%\(\)]+\d+)/);
      if (mathMatch) {
        autoTool = { name: 'calculate', args: mathMatch[1] };
      }
    }
    
    // Detecta solicitações de ações
    if (lowerInput.includes('ação') || lowerInput.includes('stock') || lowerInput.includes('cotação')) {
      const stockMatch = input.match(/(?:da|de|do)\s+([A-Z]{3,5})/i);
      if (stockMatch) {
        autoTool = { name: 'getStockPrice', args: stockMatch[1].toUpperCase() };
      }
    }
    
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
      const response = await fetch('/api/claude/sdk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages.map((m, idx) => {
            // Adiciona instruções de tools na primeira mensagem do usuário
            if (idx === 0 && m.role === 'user') {
              return {
                role: m.role,
                content: `[INSTRUÇÕES: Você tem ferramentas disponíveis. Use TOOL:getWeather:cidade para clima, TOOL:getStockPrice:símbolo para ações, TOOL:calculate:expressão para cálculos]

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
      
      if (!response.ok) throw new Error('Failed to get response');
      
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
              try {
                const data = JSON.parse(line.slice(6));
                
                if (data.session_id && !sessionId) {
                  setSessionId(data.session_id);
                }
                
                if (data.type === 'text_chunk' && data.content) {
                  assistantContent += data.content;
                  
                  // Detecta comandos de tool
                  const toolMatch = assistantContent.match(/TOOL:(\w+):(.+?)(?:\n|$)/);
                  if (toolMatch && !toolPending) {
                    toolPending = {
                      name: toolMatch[1],
                      args: toolMatch[2]
                    };
                  }
                }
              } catch (e) {
                // Ignora erros de parse
              }
            }
          }
        }
      }
      
      // Cria mensagem do assistente
      const assistantMessage: Message = {
        id: `msg-${Date.now()}-assistant`,
        role: 'assistant',
        content: assistantContent.replace(/TOOL:\w+:.+?(?:\n|$)/g, '').trim(),
        timestamp: new Date().toISOString()
      };
      
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
        setMessages(prev => [...prev, assistantMessage]);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const clearMessages = () => {
    setMessages([]);
    setSessionId(null);
  };
  
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
            <h1 className="text-xl font-semibold">Chat - Clima</h1>
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
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="mx-auto max-w-4xl space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <Sparkles className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
              <p className="text-muted-foreground mb-6">
                Experimente perguntar sobre clima!
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl mx-auto text-left">
                <button
                  onClick={() => handleSend("Qual é o clima em São Paulo?")}
                  className="p-3 border rounded-lg hover:bg-muted/50 transition-colors text-sm font-semibold"
                >
                  Qual é o clima em São Paulo?
                </button>
                <button
                  onClick={() => handleSend("Como está o tempo no Rio de Janeiro?")}
                  className="p-3 border rounded-lg hover:bg-muted/50 transition-colors text-sm font-semibold"
                >
                  Como está o tempo no Rio de Janeiro?
                </button>
                <button
                  onClick={() => handleSend("Qual é o clima em Hong Kong?")}
                  className="p-3 border rounded-lg hover:bg-muted/50 transition-colors text-sm font-semibold"
                >
                  Qual é o clima em Hong Kong?
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
        </div>
      </div>
      
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