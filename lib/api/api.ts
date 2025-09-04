/**
 * Cliente API para comunicação com o backend
 */

// import { config } from './config'; // Comentado temporariamente

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: Date;
  tokens?: {
    input?: number;
    output?: number;
  };
  cost?: number;
}

export interface StreamResponse {
  type: 'text_chunk' | 'assistant_text' | 'tool_use' | 'tool_result' | 'result' | 'error' | 'done' | 'processing' | 'session_migrated';
  content?: string;
  tool?: string;
  id?: string;
  tool_id?: string;
  session_id: string;
  input_tokens?: number;
  output_tokens?: number;
  cost_usd?: number;
  error?: string;
}

class ChatAPI {
  private baseUrl: string;
  // SOLUÇÃO DEFINITIVA: Session ID FIXO (UUID válido)
  private readonly FIXED_SESSION_ID = '00000000-0000-0000-0000-000000000001';
  private sessionId: string = this.FIXED_SESSION_ID;

  constructor(baseUrl?: string) {
    // Usa URL fixa do backend Python
    this.baseUrl = baseUrl || 'http://localhost:8002';
    
    // SEMPRE usa o session ID fixo
    this.sessionId = this.FIXED_SESSION_ID;
    console.log('🎯 Usando Session ID Fixo:', this.sessionId);
    
    // Salva no localStorage para consistência
    if (typeof window !== 'undefined') {
      localStorage.setItem('current_session_id', this.FIXED_SESSION_ID);
    }
    
    // Debug
    console.log('🔌 API configurada para:', this.baseUrl);
  }




  // Método para definir sessionId - IGNORADO: sempre usa o ID fixo
  setSessionId(sessionId: string | null) {
    console.log('⚠️ Tentativa de mudar sessionId ignorada. Usando ID fixo:', this.FIXED_SESSION_ID);
    // NÃO muda o sessionId - sempre usa o fixo
    this.sessionId = this.FIXED_SESSION_ID;
  }

  // Método para obter sessionId atual - sempre retorna o fixo
  getSessionId(): string {
    return this.FIXED_SESSION_ID;
  }

  async sendMessage(
    message: string,
    onStream: (data: StreamResponse) => void,
    onError?: (error: string) => void,
    onComplete?: () => void,
    sessionId?: string // Parâmetro opcional para forçar sessionId
  ): Promise<void> {
    // Se sessionId foi passado, usa ele
    if (sessionId) {
      this.setSessionId(sessionId);
    }
    // Debug log
    console.log('📤 Enviando mensagem:', {
      message: message.substring(0, 100),
      sessionId: this.sessionId,
      url: `${this.baseUrl}/api/chat`,
      timestamp: new Date().toISOString()
    });

    const requestBody = {
      message,
      session_id: this.sessionId,
    };

    console.log('📦 Request body:', requestBody);

    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    console.log('📥 Response status:', response.status, response.statusText);

    if (!response.ok) {
      console.error('❌ Erro na resposta:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      });
      throw new Error('Failed to send message');
    }

    // Processa stream SSE
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    
    if (!reader) {
      throw new Error('No response body');
    }

    let buffer = '';
    let completeCalled = false;

    while (true) {
      const { done, value } = await reader.read();
      
      if (done) {
        // Só chama onComplete se ainda não foi chamado
        if (onComplete && !completeCalled) {
          completeCalled = true;
          onComplete();
        }
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const dataStr = line.slice(6);
          if (dataStr.trim()) {
            try {
              const data = JSON.parse(dataStr) as StreamResponse;
              
              console.log('📨 SSE data received:', {
                type: data.type,
                sessionId: data.session_id,
                content: data.content ? data.content.substring(0, 50) : undefined,
                timestamp: new Date().toISOString()
              });
              
              // NÃO atualiza sessionId - sempre usa o FIXO
              if (data.session_id && data.session_id !== this.FIXED_SESSION_ID) {
                console.log('⚠️ Servidor retornou sessionId diferente:', data.session_id);
                console.log('🎯 Mantendo Session ID Fixo:', this.FIXED_SESSION_ID);
                // Monitor vai consolidar automaticamente
              }
              
              if (data.type === 'error' && onError) {
                console.error('❌ Erro no stream:', data.error);
                onError(data.error || 'Unknown error');
              } else if (data.type === 'done') {
                console.log('✅ Stream completo');
                // Marca como completo e chama callback
                if (onComplete && !completeCalled) {
                  completeCalled = true;
                  onComplete();
                }
                // Não precisa processar mais após 'done'
                return;
              } else {
                onStream(data);
              }
            } catch (e) {
              console.error('Failed to parse SSE data:', e, 'Raw data:', dataStr);
            }
          }
        }
      }
    }
  }

  async interruptSession(): Promise<void> {
    if (!this.sessionId) return;

    const response = await fetch(`${this.baseUrl}/api/interrupt`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        session_id: this.sessionId,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to interrupt session');
    }
  }

  async clearSession(): Promise<void> {
    if (!this.sessionId) return;

    const response = await fetch(`${this.baseUrl}/api/clear`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        session_id: this.sessionId,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to clear session');
    }
  }

  async deleteSession(): Promise<void> {
    if (!this.sessionId) return;

    const response = await fetch(`${this.baseUrl}/api/session/${this.sessionId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Failed to delete session');
    }

    this.sessionId = this.FIXED_SESSION_ID;
  }
}

export default ChatAPI;