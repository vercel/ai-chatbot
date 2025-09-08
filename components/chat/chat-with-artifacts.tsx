'use client';

import { useState, useRef, useEffect } from 'react';
import { 
  ResizablePanel, 
  ResizablePanelGroup, 
  ResizableHandle 
} from '@/components/ui/resizable';
import { ArtifactPanel } from '../artifacts/artifact-panel';
import { useArtifact } from '@/hooks/artifacts/use-artifact';
import { toast } from 'sonner';
import { Send, Loader2, PanelLeftClose, PanelLeft } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export function ChatWithArtifacts() {
  const { createArtifact, updateArtifact, activeArtifact } = useArtifact();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showArtifacts, setShowArtifacts] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll para o final quando novas mensagens chegam
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Função para processar comandos especiais do Claude
  const processClaudeCommand = (response: string): string => {
    let processedResponse = response;

    // Detectar comando para criar documento
    const createMatch = response.match(/\[CREATE_DOCUMENT:(.*?)\]/);
    if (createMatch) {
      const title = createMatch[1];
      const artifact = createArtifact(title, 'markdown');
      toast.success(`Documento "${title}" criado!`);
      processedResponse = processedResponse.replace(createMatch[0], '');
    }

    // Detectar comando para atualizar documento
    const updateMatch = response.match(/\[UPDATE_DOCUMENT\](.*?)\[\/UPDATE_DOCUMENT\]/s);
    if (updateMatch && activeArtifact) {
      const content = updateMatch[1].trim();
      updateArtifact(activeArtifact.id, { content });
      toast.success('Documento atualizado!');
      processedResponse = processedResponse.replace(updateMatch[0], 
        `✅ Documento "${activeArtifact.title}" foi atualizado.`);
    }

    // Detectar comando para inserir no documento
    const appendMatch = response.match(/\[APPEND_DOCUMENT\](.*?)\[\/APPEND_DOCUMENT\]/s);
    if (appendMatch && activeArtifact) {
      const newContent = appendMatch[1].trim();
      const currentContent = activeArtifact.content;
      updateArtifact(activeArtifact.id, { 
        content: currentContent + '\n\n' + newContent 
      });
      toast.success('Conteúdo adicionado ao documento!');
      processedResponse = processedResponse.replace(appendMatch[0], 
        `✅ Conteúdo adicionado ao documento "${activeArtifact.title}".`);
    }

    return processedResponse.trim();
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Adicionar contexto do documento ativo se houver
      let enhancedMessage = input;
      if (activeArtifact) {
        enhancedMessage = `
Contexto: Estou editando um documento chamado "${activeArtifact.title}" do tipo ${activeArtifact.type}.

Conteúdo atual do documento:
"""
${activeArtifact.content || '(documento vazio)'}
"""

Pergunta/Comando: ${input}

IMPORTANTE: Você pode usar os seguintes comandos para interagir com o documento:
- [CREATE_DOCUMENT:título] para criar um novo documento
- [UPDATE_DOCUMENT]conteúdo[/UPDATE_DOCUMENT] para substituir todo o conteúdo
- [APPEND_DOCUMENT]conteúdo[/APPEND_DOCUMENT] para adicionar conteúdo ao final
`;
      }

      // Chamar API do Claude
      const response = await fetch('/api/claude/sdk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: [
            { role: 'user', content: enhancedMessage }
          ],
          sessionId: `session-${Date.now()}`
        })
      });

      if (!response.ok) {
        throw new Error('Erro ao enviar mensagem');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullResponse = '';

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
                if (data.content) {
                  fullResponse += data.content;
                }
              } catch (e) {
                // Ignorar linhas que não são JSON válido
              }
            }
          }
        }
      }

      // Processar comandos especiais
      const processedResponse = processClaudeCommand(fullResponse);

      const assistantMessage: Message = {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: processedResponse,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      toast.error('Erro ao enviar mensagem. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="h-screen flex flex-col">
      <ResizablePanelGroup direction="horizontal" className="flex-1">
        {/* Painel do Chat */}
        <ResizablePanel defaultSize={50} minSize={30}>
          <div className="h-full flex flex-col bg-white dark:bg-gray-900">
            {/* Header do chat */}
            <div className="border-b px-4 py-3 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900 dark:text-gray-100">
                Chat com Claude
              </h2>
              <button
                onClick={() => setShowArtifacts(!showArtifacts)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                title={showArtifacts ? 'Ocultar artifacts' : 'Mostrar artifacts'}
              >
                {showArtifacts ? <PanelLeftClose className="h-5 w-5" /> : <PanelLeft className="h-5 w-5" />}
              </button>
            </div>
            
            {/* Área de mensagens */}
            <div className="flex-1 overflow-auto p-4">
              {messages.length === 0 && (
                <div className="text-center text-gray-500 dark:text-gray-400 mt-8">
                  <p className="mb-2">Olá! Como posso ajudar você hoje?</p>
                  <p className="text-sm">
                    {activeArtifact 
                      ? `Você está editando: "${activeArtifact.title}"`
                      : 'Crie um documento para começar a editar enquanto conversamos'}
                  </p>
                </div>
              )}

              {messages.map((msg) => (
                <div 
                  key={msg.id} 
                  className={`mb-4 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}
                >
                  <div className={`
                    inline-block max-w-[80%] p-3 rounded-lg
                    ${msg.role === 'user' 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                    }
                  `}>
                    <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                    <p className={`text-xs mt-1 ${
                      msg.role === 'user' ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'
                    }`}>
                      {msg.timestamp.toLocaleTimeString('pt-BR', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </p>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Claude está pensando...</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input de mensagem */}
            <div className="border-t p-4">
              <div className="flex gap-2">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={
                    activeArtifact 
                      ? `Pergunte sobre "${activeArtifact.title}" ou peça para editar...`
                      : "Digite sua mensagem..."
                  }
                  className="flex-1 px-4 py-2 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700"
                  rows={2}
                  disabled={isLoading}
                />
                <button
                  onClick={sendMessage}
                  disabled={isLoading || !input.trim()}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white rounded-lg transition-colors disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Send className="h-5 w-5" />
                  )}
                </button>
              </div>
              
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Dica: Use Shift+Enter para nova linha, Enter para enviar
              </p>
            </div>
          </div>
        </ResizablePanel>

        {showArtifacts && (
          <>
            <ResizableHandle />
            
            {/* Painel do Editor */}
            <ResizablePanel defaultSize={50} minSize={30}>
              <ArtifactPanel />
            </ResizablePanel>
          </>
        )}
      </ResizablePanelGroup>
    </div>
  );
}