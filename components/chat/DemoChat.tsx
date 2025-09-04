'use client';

import React from 'react';
import { ChatMessage } from './ChatMessage';
import { MessageInput } from './MessageInput';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Bot, RefreshCw, Settings, Download, Trash2, PlayCircle } from 'lucide-react';

// Log para debug
console.log('🏁 DemoChat.tsx carregado!');

// Histórico de demonstração
const DEMO_HISTORY = [
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

console.log('📚 DEMO_HISTORY criado:', DEMO_HISTORY);
console.log('📊 Total de mensagens no histórico:', DEMO_HISTORY.length);

export function DemoChat() {
  const [messages, setMessages] = React.useState(DEMO_HISTORY);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isRunningDemo, setIsRunningDemo] = React.useState(false);
  const [sessionId, setSessionId] = React.useState<string | null>(null);
  
  // Log inicial
  React.useEffect(() => {
    console.log('🚀 DemoChat montado!');
    console.log('📝 Mensagens iniciais:', messages);
    console.log('📊 Total de mensagens:', messages.length);
  }, []);
  
  // Log quando mensagens mudam
  React.useEffect(() => {
    console.log('📬 Mensagens atualizadas:', messages);
    console.log('📊 Total atual:', messages.length);
  }, [messages]);
  
  const handleSend = async (input: string) => {
    console.log('🎯 handleSend chamado com input:', input);
    if (!input.trim() || isLoading) {
      console.log('⚠️ Input vazio ou carregando:', { input, isLoading });
      return;
    }
    
    const userMessage = {
      id: `msg-${Date.now()}`,
      role: 'user' as const,
      content: input,
      timestamp: new Date().toISOString()
    };
    
    console.log('👤 Mensagem do usuário criada:', userMessage);
    
    // Adicionar mensagem do usuário primeiro
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setIsLoading(true);
    
    console.log('📤 Enviando para Claude com contexto:', updatedMessages.length, 'mensagens');
    
    // Para manter contexto, enviamos todas as mensagens anteriores + a nova
    // O Claude SDK precisa do histórico completo para manter contexto
    try {
      const response = await fetch('/api/claude/sdk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages.map(m => ({
            role: m.role,
            content: m.content
          })),
          sessionId: sessionId || undefined // Usar session ID real se existir
        })
      });
      
      if (!response.ok) throw new Error('Failed to get response');
      
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
                
                // Captura o session_id se não temos ainda
                if (data.session_id && !sessionId) {
                  console.log('🔑 Session ID capturado:', data.session_id);
                  setSessionId(data.session_id);
                }
                
                if (data.type === 'text_chunk' && data.content) {
                  assistantContent += data.content;
                  console.log('📝 Chunk recebido:', data.content);
                }
              } catch (e) {
                if (line.trim() !== 'data: ') {
                  console.log('⚠️ Erro ao fazer parse de linha:', line);
                }
              }
            }
          }
        }
      }
      
      if (assistantContent) {
        console.log('📥 Resposta do Claude:', assistantContent.substring(0, 100) + '...');
        setMessages(prev => [...prev, {
          id: `msg-${Date.now()}-assistant`,
          role: 'assistant',
          content: assistantContent,
          timestamp: new Date().toISOString()
        }]);
      } else {
        console.log('⚠️ Nenhuma resposta do Claude recebida');
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const clearMessages = () => {
    setMessages([]);
    setInput('');
  };
  
  const runDemo = async () => {
    setIsRunningDemo(true);
    setMessages([]);
    
    const demoQuestions = [
      'Olá Claude, qual é a capital do Brasil?',
      'Quanto é 10 multiplicado por 20?',
      'Diga apenas SIM se você está funcionando'
    ];
    
    for (const question of demoQuestions) {
      // Adicionar pergunta
      const userMsg = {
        id: `demo-user-${Date.now()}`,
        role: 'user' as const,
        content: question,
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, userMsg]);
      await new Promise(resolve => setTimeout(resolve, 500));
      
      try {
        // Fazer chamada real ao Claude
        const response = await fetch('/api/claude/sdk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [{ role: 'user', content: question }]
          })
        });
        
        if (response.ok) {
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
                    if (data.type === 'text_chunk' && data.content) {
                      assistantContent += data.content;
                    }
                  } catch (e) {}
                }
              }
            }
          }
          
          if (assistantContent) {
            const assistantMsg = {
              id: `demo-assistant-${Date.now()}`,
              role: 'assistant' as const,
              content: assistantContent,
              timestamp: new Date().toISOString()
            };
            setMessages(prev => [...prev, assistantMsg]);
          }
        }
      } catch (error) {
        console.error('Demo error:', error);
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    setIsRunningDemo(false);
  };
  
  const reloadHistorico = () => {
    setMessages(DEMO_HISTORY);
  };
  
  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Bot className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-semibold">Claude Chat - Demo com Histórico</h1>
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
            <Button 
              variant="ghost" 
              size="icon"
              onClick={reloadHistorico}
              title="Recarregar histórico original"
            >
              <RefreshCw className="h-5 w-5" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={runDemo}
              disabled={isRunningDemo}
              title="Executar nova demonstração"
            >
              <PlayCircle className={`h-5 w-5 ${isRunningDemo ? 'animate-pulse' : ''}`} />
            </Button>
            <Button variant="ghost" size="icon">
              <Settings className="h-5 w-5" />
            </Button>
          </div>
        </div>
        <div className="border-b bg-muted/30 px-4 py-2">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>🎯 Conversa de Teste Bem-Sucedida - {messages.length} mensagens</span>
            {isRunningDemo && (
              <span className="animate-pulse text-primary">
                🤖 Executando demonstração ao vivo...
              </span>
            )}
          </div>
        </div>
      </header>
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="mx-auto max-w-4xl space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <p>Nenhuma mensagem ainda. Clique em ▶️ para executar uma demonstração!</p>
            </div>
          ) : (
            messages.map((message, index) => {
              console.log(`🔍 Renderizando mensagem ${index}:`, message);
              return (
                <ChatMessage 
                  key={message.id} 
                  role={message.role}
                  content={message.content}
                  timestamp={new Date(message.timestamp)}
                />
              );
            })
          )}
          {isLoading && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <div className="animate-pulse">Claude está digitando...</div>
            </div>
          )}
        </div>
      </div>
      
      {/* Input */}
      <MessageInput
        onSendMessage={handleSend}
        disabled={isLoading || isRunningDemo}
        isStreaming={isLoading}
        placeholder="Digite sua mensagem e pressione Enter..."
      />
    </div>
  );
}