'use client';

import { useState, useCallback, useEffect } from 'react';

const CLAUDE_API_URL = process.env.NEXT_PUBLIC_CLAUDE_SDK_API_URL || 'http://localhost:8002';

export interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: string;
}

export function useClaudeSDK(initialSessionId?: string) {
  const [messages, setMessages] = useState<ClaudeMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(initialSessionId || null);

  // Cria sessão ao montar o componente (se não foi fornecido um ID inicial)
  useEffect(() => {
    const initSession = async () => {
      // Se já tem um sessionId inicial
      if (initialSessionId) {
        // Se tem 8 caracteres, é um shortId, precisa buscar a sessão completa
        if (initialSessionId.length === 8) {
          try {
            // Tenta buscar a sessão completa
            const response = await fetch(`${CLAUDE_API_URL}/api/claude/session/by-short/${initialSessionId}`, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json'
              }
            });
            
            if (response.ok) {
              const data = await response.json();
              setSessionId(data.session_id);
              
              // Busca o histórico se existir
              const historyResponse = await fetch(`${CLAUDE_API_URL}/api/claude/session/${data.session_id}/history`, {
                method: 'GET',
                headers: {
                  'Content-Type': 'application/json'
                }
              });
              
              if (historyResponse.ok) {
                const historyData = await historyResponse.json();
                if (historyData.history && historyData.history.length > 0) {
                  // Carrega o histórico
                  setMessages(historyData.history);
                }
              }
            } else {
              // Se não encontrar, usa o shortId como início de uma nova sessão
              setSessionId(initialSessionId);
            }
          } catch (error) {
            console.error('Erro ao buscar sessão:', error);
            setSessionId(initialSessionId);
          }
        } else {
          // Se tem mais de 8 caracteres, é um ID completo
          setSessionId(initialSessionId);
          
          // Busca o histórico
          try {
            const historyResponse = await fetch(`${CLAUDE_API_URL}/api/claude/session/${initialSessionId}/history`, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json'
              }
            });
            
            if (historyResponse.ok) {
              const historyData = await historyResponse.json();
              if (historyData.history && historyData.history.length > 0) {
                setMessages(historyData.history);
              }
            }
          } catch (error) {
            console.error('Erro ao buscar histórico:', error);
          }
        }
        return;
      }
      
      // Se não tem sessionId inicial, cria uma nova sessão
      try {
        const response = await fetch(`${CLAUDE_API_URL}/api/claude/session`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        const data = await response.json();
        setSessionId(data.session_id);
      } catch (error) {
        console.error('Erro ao criar sessão:', error);
        // Fallback para sessão local se API falhar
        setSessionId(`session-${Date.now()}`);
      }
    };
    
    initSession();
  }, [initialSessionId]);

  const sendMessage = useCallback(async (content: string, options?: { streamSpeed?: number }) => {
    // Aguarda sessão ser criada se ainda não existir
    if (!sessionId) {
      console.warn('Sessão ainda não criada');
      return;
    }
    // Adiciona mensagem do usuário
    const userMessage: ClaudeMessage = { role: 'user', content };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Chama backend Python DIRETAMENTE
      const response = await fetch(`${CLAUDE_API_URL}/api/claude/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer dev-token'
        },
        body: JSON.stringify({
          message: content,
          session_id: sessionId,
          stream_speed: options?.streamSpeed || 50
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Processa SSE stream
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      
      if (!reader) {
        throw new Error('No response body');
      }

      // Adiciona mensagem vazia do assistente imediatamente
      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);
      
      let assistantMessage = '';
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.type === 'assistant_text' && data.content) {
                assistantMessage += data.content;
                // Atualiza a última mensagem do assistente
                setMessages(prev => {
                  const newMessages = [...prev];
                  const lastMessage = newMessages[newMessages.length - 1];
                  
                  if (lastMessage?.role === 'assistant') {
                    lastMessage.content = assistantMessage;
                  }
                  
                  return newMessages;
                });
              }
            } catch (e) {
              console.error('Parse error:', e);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Erro: ${error}`
      }]);
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  const clearMessages = useCallback(async () => {
    setMessages([]);
    
    // Cria nova sessão ao limpar
    try {
      // Deleta sessão anterior se existir
      if (sessionId) {
        await fetch(`${CLAUDE_API_URL}/api/claude/session/${sessionId}`, {
          method: 'DELETE'
        });
      }
      
      // Cria nova sessão
      const response = await fetch(`${CLAUDE_API_URL}/api/claude/session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      setSessionId(data.session_id);
    } catch (error) {
      console.error('Erro ao recriar sessão:', error);
      // Fallback para sessão local
      setSessionId(`session-${Date.now()}`);
    }
  }, [sessionId]);

  return {
    messages,
    sendMessage,
    clearMessages,
    isLoading,
    sessionId
  };
}