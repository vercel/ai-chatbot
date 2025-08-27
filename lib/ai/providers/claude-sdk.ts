import type { CoreMessage, LanguageModelV1 } from '@ai-sdk/provider';
import { createEventSourceResponseHandler } from 'ai';

interface ClaudeSDKProviderConfig {
  apiUrl?: string;
  authToken?: string;
}

interface SSEMessage {
  type: 'assistant_text' | 'tool_use' | 'tool_result' | 'result' | 'error' | 'done';
  content?: string;
  tool?: string;
  id?: string;
  tool_id?: string;
  session_id?: string;
  input_tokens?: number;
  output_tokens?: number;
  cost_usd?: number;
  error?: string;
  message_count?: number;
}

/**
 * Claude Code SDK Provider for AI SDK
 * Connects to local Claude via Python backend
 */
export class ClaudeSDKProvider {
  private apiUrl: string;
  private authToken?: string;
  private sessionId?: string;

  constructor(config?: ClaudeSDKProviderConfig) {
    // Use NEXT_PUBLIC_ para variáveis de ambiente no cliente
    this.apiUrl = config?.apiUrl || 
                  process.env.NEXT_PUBLIC_CLAUDE_SDK_API_URL || 
                  process.env.CLAUDE_SDK_API_URL || 
                  'http://127.0.0.1:8002';
    this.authToken = config?.authToken;
  }

  async *streamText(
    messages: CoreMessage[],
    options?: {
      sessionId?: string;
      temperature?: number;
      maxTokens?: number;
    }
  ): AsyncGenerator<any> {
    // Get or create session ID
    this.sessionId = options?.sessionId || this.sessionId || this.generateSessionId();

    // Get last message (the one to send)
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage || lastMessage.role !== 'user') {
      throw new Error('Last message must be from user');
    }

    // Extract text content
    const messageText = typeof lastMessage.content === 'string' 
      ? lastMessage.content 
      : lastMessage.content.find(c => c.type === 'text')?.text || '';

    try {
      // Send request to Python backend
      const response = await fetch(`${this.apiUrl}/api/claude/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.authToken && { 'Authorization': `Bearer ${this.authToken}` })
        },
        body: JSON.stringify({
          message: messageText,
          session_id: this.sessionId
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Process SSE stream
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      
      if (!reader) {
        throw new Error('No response body');
      }

      let buffer = '';
      let currentText = '';

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('event: ')) {
            // Skip event type lines
            continue;
          }
          
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6);
            if (dataStr.trim()) {
              try {
                const data = JSON.parse(dataStr) as SSEMessage;
                
                if (data.type === 'assistant_text') {
                  // Accumulate text
                  currentText += data.content || '';
                  
                  // Yield text delta
                  yield {
                    type: 'text-delta',
                    textDelta: data.content || ''
                  };
                } else if (data.type === 'tool_use') {
                  // Tool usage notification
                  yield {
                    type: 'tool-call',
                    toolCallType: 'function',
                    toolCallId: data.id || '',
                    toolName: data.tool || '',
                    args: {}
                  };
                } else if (data.type === 'result') {
                  // Final result with token usage
                  yield {
                    type: 'finish',
                    finishReason: 'stop',
                    usage: {
                      promptTokens: data.input_tokens || 0,
                      completionTokens: data.output_tokens || 0
                    }
                  };
                } else if (data.type === 'error') {
                  throw new Error(data.error || 'Unknown error');
                } else if (data.type === 'done') {
                  // Stream complete
                  break;
                }
              } catch (e) {
                console.error('Failed to parse SSE data:', e);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Claude SDK Provider error:', error);
      throw error;
    }
  }

  async interruptSession(): Promise<void> {
    if (!this.sessionId) return;

    await fetch(`${this.apiUrl}/api/claude/interrupt/${this.sessionId}`, {
      method: 'POST',
      headers: {
        ...(this.authToken && { 'Authorization': `Bearer ${this.authToken}` })
      }
    });
  }

  async clearSession(): Promise<void> {
    if (!this.sessionId) return;

    await fetch(`${this.apiUrl}/api/claude/clear/${this.sessionId}`, {
      method: 'POST',
      headers: {
        ...(this.authToken && { 'Authorization': `Bearer ${this.authToken}` })
      }
    });
  }

  private generateSessionId(): string {
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Factory function for AI SDK compatibility
export function claudeSDK(config?: ClaudeSDKProviderConfig): any {
  const provider = new ClaudeSDKProvider(config);
  
  return {
    languageModel: (modelId: string) => ({
      specificationVersion: 'v1' as const,
      provider: 'claude-sdk',
      modelId,
      defaultObjectGenerationMode: 'tool' as const,

      async doStream(request: any) {
        const messages = request.messages;
        const streamGenerator = provider.streamText(messages, {
          sessionId: request.sessionId,
          temperature: request.temperature,
          maxTokens: request.maxTokens
        });

        return {
          stream: streamGenerator,
          rawCall: {
            rawPrompt: messages,
            rawSettings: {}
          }
        };
      }
    })
  };
}