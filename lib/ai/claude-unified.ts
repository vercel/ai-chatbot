/**
 * Abstração unificada para Claude AI
 * Resolve o problema de múltiplas implementações paralelas
 */

import { z } from 'zod';
import { appConfig } from '@/lib/config/app-config';

// Schema para mensagens
const messageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string(),
  timestamp: z.date().optional(),
});

const chatRequestSchema = z.object({
  messages: z.array(messageSchema),
  sessionId: z.string().optional(),
  provider: z.enum(['claude-sdk', 'claude-chat', 'claude-main']).optional(),
  options: z.object({
    temperature: z.number().min(0).max(1).optional(),
    maxTokens: z.number().min(1).max(100000).optional(),
    stream: z.boolean().optional(),
    tools: z.array(z.string()).optional(),
  }).optional(),
});

// Tipos exportados
export type Message = z.infer<typeof messageSchema>;
export type ChatRequest = z.infer<typeof chatRequestSchema>;

export interface ChatResponse {
  content: string;
  sessionId?: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
  metadata?: Record<string, any>;
}

export interface StreamChunk {
  type: 'text_chunk' | 'tool_use' | 'error' | 'done';
  content?: string;
  tool?: string;
  error?: string;
  session_id?: string;
}

/**
 * Interface unificada para provedores Claude
 */
interface ClaudeProvider {
  name: string;
  chat(request: ChatRequest): Promise<ChatResponse>;
  streamChat(request: ChatRequest): AsyncGenerator<StreamChunk>;
  isAvailable(): Promise<boolean>;
}

/**
 * Provider para Claude SDK oficial
 */
class ClaudeSDKProvider implements ClaudeProvider {
  name = 'claude-sdk';
  
  async chat(request: ChatRequest): Promise<ChatResponse> {
    const response = await fetch('/api/claude/sdk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: request.messages,
        sessionId: request.sessionId,
        ...request.options,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Claude SDK error: ${response.statusText}`);
    }
    
    const data = await response.json();
    return {
      content: data.response || data.content || '',
      sessionId: data.sessionId,
      usage: data.usage,
      metadata: data.metadata,
    };
  }
  
  async *streamChat(request: ChatRequest): AsyncGenerator<StreamChunk> {
    const response = await fetch('/api/claude/sdk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: request.messages,
        sessionId: request.sessionId,
        stream: true,
        ...request.options,
      }),
    });
    
    if (!response.ok || !response.body) {
      throw new Error(`Claude SDK stream error: ${response.statusText}`);
    }
    
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            yield data as StreamChunk;
          } catch (e) {
            // Ignorar linhas inválidas
          }
        }
      }
    }
    
    yield { type: 'done', session_id: request.sessionId };
  }
  
  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch('/api/claude/sdk/health', {
        method: 'GET',
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}

/**
 * Provider para Claude Chat personalizado
 */
class ClaudeChatProvider implements ClaudeProvider {
  name = 'claude-chat';
  
  async chat(request: ChatRequest): Promise<ChatResponse> {
    const response = await fetch('/api/claude-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: request.messages,
        sessionId: request.sessionId,
        ...request.options,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Claude Chat error: ${response.statusText}`);
    }
    
    const data = await response.json();
    return {
      content: data.content || '',
      sessionId: data.sessionId,
      usage: data.usage,
      metadata: data.metadata,
    };
  }
  
  async *streamChat(request: ChatRequest): AsyncGenerator<StreamChunk> {
    // Implementação similar ao SDK provider
    const response = await this.chat(request);
    yield {
      type: 'text_chunk',
      content: response.content,
      session_id: response.sessionId,
    };
    yield { type: 'done', session_id: response.sessionId };
  }
  
  async isAvailable(): Promise<boolean> {
    return true; // Sempre disponível como fallback
  }
}

/**
 * Provider para Claude Main com MCP
 */
class ClaudeMainProvider implements ClaudeProvider {
  name = 'claude-main';
  
  async chat(request: ChatRequest): Promise<ChatResponse> {
    const response = await fetch('/api/claude-main', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: request.messages,
        sessionId: request.sessionId,
        enableMCP: appConfig.isFeatureEnabled('enableMCP'),
        ...request.options,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Claude Main error: ${response.statusText}`);
    }
    
    const data = await response.json();
    return {
      content: data.content || '',
      sessionId: data.sessionId,
      usage: data.usage,
      metadata: data.metadata,
    };
  }
  
  async *streamChat(request: ChatRequest): AsyncGenerator<StreamChunk> {
    // Similar aos outros providers
    const response = await this.chat(request);
    yield {
      type: 'text_chunk',
      content: response.content,
      session_id: response.sessionId,
    };
    yield { type: 'done', session_id: response.sessionId };
  }
  
  async isAvailable(): Promise<boolean> {
    return appConfig.isFeatureEnabled('enableMCP');
  }
}

/**
 * Gerenciador unificado de Claude
 */
export class ClaudeUnified {
  private static instance: ClaudeUnified;
  private providers: Map<string, ClaudeProvider>;
  private currentProvider: string;
  
  private constructor() {
    this.providers = new Map();
    this.registerProviders();
    this.currentProvider = appConfig.get('ai').defaultProvider;
  }
  
  public static getInstance(): ClaudeUnified {
    if (!ClaudeUnified.instance) {
      ClaudeUnified.instance = new ClaudeUnified();
    }
    return ClaudeUnified.instance;
  }
  
  private registerProviders() {
    this.providers.set('claude-sdk', new ClaudeSDKProvider());
    this.providers.set('claude-chat', new ClaudeChatProvider());
    this.providers.set('claude-main', new ClaudeMainProvider());
  }
  
  /**
   * Define o provider atual
   */
  public setProvider(provider: string) {
    if (!this.providers.has(provider)) {
      throw new Error(`Provider ${provider} não encontrado`);
    }
    this.currentProvider = provider;
  }
  
  /**
   * Obtém o provider atual
   */
  public getProvider(): ClaudeProvider {
    const provider = this.providers.get(this.currentProvider);
    if (!provider) {
      // Fallback para claude-chat se o provider não existir
      return this.providers.get('claude-chat')!;
    }
    return provider;
  }
  
  /**
   * Lista providers disponíveis
   */
  public async getAvailableProviders(): Promise<string[]> {
    const available: string[] = [];
    
    for (const [name, provider] of this.providers) {
      if (await provider.isAvailable()) {
        available.push(name);
      }
    }
    
    return available;
  }
  
  /**
   * Envia mensagem de chat (não streaming)
   */
  public async chat(request: ChatRequest): Promise<ChatResponse> {
    // Validar request
    const validatedRequest = chatRequestSchema.parse(request);
    
    // Usar provider específico se fornecido
    const providerName = validatedRequest.provider || this.currentProvider;
    const provider = this.providers.get(providerName) || this.getProvider();
    
    try {
      return await provider.chat(validatedRequest);
    } catch (error) {
      console.error(`Erro no provider ${provider.name}:`, error);
      
      // Tentar fallback para claude-chat
      if (provider.name !== 'claude-chat') {
        const fallback = this.providers.get('claude-chat')!;
        return await fallback.chat(validatedRequest);
      }
      
      throw error;
    }
  }
  
  /**
   * Envia mensagem de chat com streaming
   */
  public async *streamChat(request: ChatRequest): AsyncGenerator<StreamChunk> {
    // Validar request
    const validatedRequest = chatRequestSchema.parse(request);
    
    // Usar provider específico se fornecido
    const providerName = validatedRequest.provider || this.currentProvider;
    const provider = this.providers.get(providerName) || this.getProvider();
    
    try {
      yield* provider.streamChat(validatedRequest);
    } catch (error) {
      console.error(`Erro no streaming do provider ${provider.name}:`, error);
      
      // Tentar fallback para claude-chat
      if (provider.name !== 'claude-chat') {
        const fallback = this.providers.get('claude-chat')!;
        yield* fallback.streamChat(validatedRequest);
      } else {
        yield {
          type: 'error' as const,
          error: error instanceof Error ? error.message : 'Erro desconhecido',
        };
        yield { type: 'done' as const };
      }
    }
  }
  
  /**
   * Verifica saúde do sistema
   */
  public async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    providers: Record<string, boolean>;
  }> {
    const results: Record<string, boolean> = {};
    
    for (const [name, provider] of this.providers) {
      results[name] = await provider.isAvailable();
    }
    
    const availableCount = Object.values(results).filter(Boolean).length;
    
    return {
      status: availableCount === this.providers.size ? 'healthy' :
              availableCount > 0 ? 'degraded' : 'unhealthy',
      providers: results,
    };
  }
}

// Exportar instância singleton
export const claudeUnified = ClaudeUnified.getInstance();

// Exportar funções utilitárias
export const chat = (request: ChatRequest) => claudeUnified.chat(request);
export const streamChat = (request: ChatRequest) => claudeUnified.streamChat(request);
export const setProvider = (provider: string) => claudeUnified.setProvider(provider);
export const getAvailableProviders = () => claudeUnified.getAvailableProviders();
export const healthCheck = () => claudeUnified.healthCheck();

export default claudeUnified;