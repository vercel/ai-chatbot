/**
 * Serviço de integração para o sistema de load balancing
 * Fornece métodos para interagir com as APIs REST do load balancer
 */

import type { LoadBalancingDecision, ModelType } from '@/lib/load-balancing/load-balancer';

export interface LoadBalancingOptions {
  modelType?: ModelType;
  preferredProvider?: string;
  maxCost?: number;
  maxLatency?: number;
  providers?: string[];
}

export interface LoadBalancingResult {
  success: boolean;
  data?: LoadBalancingDecision;
  error?: string;
}

export interface PerformanceMetrics {
  success: boolean;
  data?: {
    providerStats: Record<string, {
      totalRequests: number;
      avgLatency: number;
      successRate: number;
      totalCost: number;
      errorRate: number;
    }>;
    totalStats: {
      totalRequests: number;
      avgLatency: number;
      successRate: number;
      totalCost: number;
    };
  };
  error?: string;
}

class LoadBalancingService {
  private readonly baseUrl: string;

  constructor(baseUrl = '') {
    this.baseUrl = baseUrl || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3001');
  }

  /**
   * Seleciona o provider ideal baseado nos critérios fornecidos
   */
  async selectProvider(options: LoadBalancingOptions = {}): Promise<LoadBalancingResult> {
    try {
      const {
        modelType = 'chat',
        preferredProvider,
        maxCost,
        maxLatency,
        providers = ['xai', 'anthropic', 'openai', 'google', 'ollama']
      } = options;

      const params = new URLSearchParams({
        modelType,
        providers: providers.join(','),
      });

      if (preferredProvider) params.append('preferredProvider', preferredProvider);
      if (maxCost !== undefined) params.append('maxCost', maxCost.toString());
      if (maxLatency !== undefined) params.append('maxLatency', maxLatency.toString());

      const response = await fetch(`${this.baseUrl}/api/load-balancing?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        return {
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      const data = await response.json();

      return {
        success: true,
        data: data.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Obtém métricas de performance dos providers
   */
  async getPerformanceMetrics(hours = 24): Promise<PerformanceMetrics> {
    try {
      const response = await fetch(`${this.baseUrl}/api/monitoring/performance?hours=${hours}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        return {
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      const data = await response.json();

      return {
        success: true,
        data: data.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Incrementa a carga de um provider (usado internamente)
   */
  async incrementLoad(provider: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/load-balancing`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider,
          action: 'increment',
        }),
      });

      if (!response.ok) {
        return {
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Decrementa a carga de um provider (usado internamente)
   */
  async decrementLoad(provider: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/load-balancing`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider,
          action: 'decrement',
        }),
      });

      if (!response.ok) {
        return {
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Wrapper conveniente para seleção de provider com tratamento de erro
   */
  async selectProviderWithFallback(
    options: LoadBalancingOptions = {},
    fallbackProvider = 'ollama'
  ): Promise<LoadBalancingDecision> {
    const result = await this.selectProvider(options);

    if (!result.success || !result.data) {
      // Fallback para provider local se falhar
      return {
        provider: fallbackProvider,
        model: 'qwen3:30b',
        reason: 'Fallback devido a erro no load balancer',
        score: 0,
        alternatives: [],
      };
    }

    return result.data;
  }
}

// Instância global do serviço
export const loadBalancingService = new LoadBalancingService();

// Funções helper para uso direto
export async function selectOptimalProvider(options?: LoadBalancingOptions): Promise<LoadBalancingResult> {
  return loadBalancingService.selectProvider(options);
}

export async function getProviderMetrics(hours?: number): Promise<PerformanceMetrics> {
  return loadBalancingService.getPerformanceMetrics(hours);
}

export async function selectProviderWithFallback(
  options?: LoadBalancingOptions,
  fallbackProvider?: string
): Promise<LoadBalancingDecision> {
  return loadBalancingService.selectProviderWithFallback(options, fallbackProvider);
}