import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

// Métricas de performance por provider
interface PerformanceMetrics {
  provider: string;
  model: string;
  latency: number;
  tokens: number;
  cost: number;
  timestamp: Date;
  success: boolean;
  error?: string;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private readonly MAX_METRICS = 1000;

  async trackRequest(
    provider: string,
    model: string,
    operation: () => Promise<any>
  ): Promise<any> {
    const startTime = Date.now();

    try {
      const result = await operation();
      const latency = Date.now() - startTime;

      // Estimar tokens baseado no resultado (simplificado)
      const tokens = this.estimateTokens(result);

      // Calcular custo baseado no provider e modelo
      const cost = this.calculateCost(provider, model, tokens);

      const metric: PerformanceMetrics = {
        provider,
        model,
        latency,
        tokens,
        cost,
        timestamp: new Date(),
        success: true
      };

      this.addMetric(metric);

      return result;
    } catch (error) {
      const latency = Date.now() - startTime;

      const metric: PerformanceMetrics = {
        provider,
        model,
        latency,
        tokens: 0,
        cost: 0,
        timestamp: new Date(),
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };

      this.addMetric(metric);
      throw error;
    }
  }

  private addMetric(metric: PerformanceMetrics) {
    this.metrics.push(metric);

    // Manter apenas as métricas mais recentes
    if (this.metrics.length > this.MAX_METRICS) {
      this.metrics = this.metrics.slice(-this.MAX_METRICS);
    }

    // Log para GCP Cloud Logging (se disponível)
    console.log('[PERFORMANCE]', JSON.stringify(metric));
  }

  private estimateTokens(result: any): number {
    // Estimativa simplificada baseada no tamanho da resposta
    if (typeof result === 'string') {
      return Math.ceil(result.length / 4); // ~4 chars por token
    }
    if (result?.text) {
      return Math.ceil(result.text.length / 4);
    }
    return 100; // fallback
  }

  private calculateCost(provider: string, model: string, tokens: number): number {
    // Custos aproximados por 1000 tokens (em USD)
    const costs: Record<string, Record<string, number>> = {
      'xai': {
        'grok-2-vision-1212': 0.0015,
        'grok-2-1212': 0.0010,
        'grok-3-mini-beta': 0.0008
      },
      'anthropic': {
        'claude-3-5-sonnet': 0.0030
      },
      'openai': {
        'gpt-4o': 0.0025
      },
      'google': {
        'gemini-pro': 0.0010,
        'gemini-pro-vision': 0.0020
      },
      'ollama': {
        'qwen3:30b': 0, // local
        'llama3.2-vision:latest': 0,
        'mistral:latest': 0,
        'falcon3:latest': 0,
        'llava:latest': 0
      }
    };

    const providerCosts = costs[provider] || {};
    const modelCost = providerCosts[model] || 0.001; // fallback

    return (tokens / 1000) * modelCost;
  }

  getMetrics(hours = 24) {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.metrics.filter(m => m.timestamp >= cutoff);
  }

  getProviderStats(hours = 24) {
    const metrics = this.getMetrics(hours);
    const stats: Record<string, any> = {};

    metrics.forEach(metric => {
      if (!stats[metric.provider]) {
        stats[metric.provider] = {
          totalRequests: 0,
          successfulRequests: 0,
          totalLatency: 0,
          totalCost: 0,
          totalTokens: 0
        };
      }

      const providerStats = stats[metric.provider];
      providerStats.totalRequests++;
      providerStats.totalLatency += metric.latency;
      providerStats.totalCost += metric.cost;
      providerStats.totalTokens += metric.tokens;

      if (metric.success) {
        providerStats.successfulRequests++;
      }
    });

    // Calcular médias e taxas
    Object.keys(stats).forEach(provider => {
      const providerStats = stats[provider];
      providerStats.successRate = providerStats.successfulRequests / providerStats.totalRequests;
      providerStats.avgLatency = providerStats.totalLatency / providerStats.totalRequests;
      providerStats.avgTokens = providerStats.totalTokens / providerStats.totalRequests;
    });

    return stats;
  }

  getModelPerformance(hours = 24) {
    const metrics = this.getMetrics(hours);
    const modelStats: Record<string, any> = {};

    metrics.forEach(metric => {
      const key = `${metric.provider}:${metric.model}`;

      if (!modelStats[key]) {
        modelStats[key] = {
          totalRequests: 0,
          successfulRequests: 0,
          totalLatency: 0,
          totalCost: 0,
          totalTokens: 0
        };
      }

      const stats = modelStats[key];
      stats.totalRequests++;
      stats.totalLatency += metric.latency;
      stats.totalCost += metric.cost;
      stats.totalTokens += metric.tokens;

      if (metric.success) {
        stats.successfulRequests++;
      }
    });

    // Calcular métricas finais
    Object.keys(modelStats).forEach(key => {
      const stats = modelStats[key];
      stats.avgLatency = stats.totalLatency / stats.totalRequests;
      stats.successRate = stats.successfulRequests / stats.totalRequests;
      stats.costPerToken = stats.totalTokens > 0 ? stats.totalCost / stats.totalTokens : 0;
    });

    return modelStats;
  }
}

// Instância global do monitor
export const performanceMonitor = new PerformanceMonitor();

// Função helper para rastrear chamadas de IA
export async function trackAIRequest(
  provider: string,
  model: string,
  operation: () => Promise<any>
) {
  return performanceMonitor.trackRequest(provider, model, operation);
}

// Endpoint para métricas
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const hours = Number.parseInt(searchParams.get('hours') || '24');

  try {
    const providerStats = performanceMonitor.getProviderStats(hours);
    const modelStats = performanceMonitor.getModelPerformance(hours);

    return NextResponse.json({
      success: true,
      data: {
        providerStats,
        modelStats,
        timeRange: `${hours} hours`
      }
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}