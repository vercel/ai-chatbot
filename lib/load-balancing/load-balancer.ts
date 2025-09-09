import { performanceMonitor } from '../monitoring/performance';

export interface ProviderConfig {
  name: string;
  priority: number; // 1 = highest priority
  maxConcurrent: number;
  costWeight: number; // 0-1, quanto peso dar ao custo
  latencyWeight: number; // 0-1, quanto peso dar à latência
  reliabilityWeight: number; // 0-1, quanto peso dar à confiabilidade
  enabled: boolean;
}

export interface LoadBalancingDecision {
  provider: string;
  model: string;
  reason: string;
  score: number;
  alternatives: Array<{
    provider: string;
    model: string;
    score: number;
    reason: string;
  }>;
}

class LoadBalancer {
  private readonly providerConfigs: Map<string, ProviderConfig> = new Map();
  private readonly activeRequests: Map<string, number> = new Map(); // provider -> count

  constructor() {
    this.initializeDefaultConfigs();
  }

  private initializeDefaultConfigs() {
    // Configurações padrão para cada provider
    const defaultConfigs: Record<string, ProviderConfig> = {
      'xai': {
        name: 'xAI (Grok)',
        priority: 1,
        maxConcurrent: 10,
        costWeight: 0.3,
        latencyWeight: 0.4,
        reliabilityWeight: 0.3,
        enabled: true
      },
      'anthropic': {
        name: 'Anthropic',
        priority: 2,
        maxConcurrent: 5,
        costWeight: 0.4,
        latencyWeight: 0.3,
        reliabilityWeight: 0.3,
        enabled: true
      },
      'openai': {
        name: 'OpenAI',
        priority: 2,
        maxConcurrent: 8,
        costWeight: 0.3,
        latencyWeight: 0.4,
        reliabilityWeight: 0.3,
        enabled: true
      },
      'google': {
        name: 'Google (Vertex)',
        priority: 3,
        maxConcurrent: 6,
        costWeight: 0.2,
        latencyWeight: 0.5,
        reliabilityWeight: 0.3,
        enabled: true
      },
      'ollama': {
        name: 'Ollama (Local)',
        priority: 4,
        maxConcurrent: 3,
        costWeight: 0.1, // custo zero
        latencyWeight: 0.6, // pode ser mais lento
        reliabilityWeight: 0.3,
        enabled: true
      }
    };

    Object.entries(defaultConfigs).forEach(([provider, config]) => {
      this.providerConfigs.set(provider, config);
    });
  }

  configureProvider(provider: string, config: Partial<ProviderConfig>) {
    const existing = this.providerConfigs.get(provider);
    if (existing) {
      this.providerConfigs.set(provider, { ...existing, ...config });
    }
  }

  async selectProvider(
    availableProviders: string[],
    modelType: 'chat' | 'vision' | 'reasoning' | 'artifact' = 'chat',
    userPreferences?: {
      preferredProvider?: string;
      maxCost?: number;
      maxLatency?: number;
    }
  ): Promise<LoadBalancingDecision> {
    const candidates = availableProviders
      .filter(provider => {
        const config = this.providerConfigs.get(provider);
        return config?.enabled && this.canAcceptRequest(provider);
      })
      .map(provider => ({
        provider,
        score: this.calculateProviderScore(provider, modelType, userPreferences),
        reason: this.getProviderReason(provider, modelType)
      }))
      .sort((a, b) => b.score - a.score);

    if (candidates.length === 0) {
      throw new Error('No available providers can handle the request');
    }

    const best = candidates[0];
    const alternatives = candidates.slice(1, 4); // Top 3 alternatives

    return {
      provider: best.provider,
      model: this.getModelForProvider(best.provider, modelType),
      reason: best.reason,
      score: best.score,
      alternatives: alternatives.map(alt => ({
        provider: alt.provider,
        model: this.getModelForProvider(alt.provider, modelType),
        score: alt.score,
        reason: alt.reason
      }))
    };
  }

  private calculateProviderScore(
    provider: string,
    modelType: 'chat' | 'vision' | 'reasoning' | 'artifact',
    userPreferences?: { preferredProvider?: string; maxCost?: number; maxLatency?: number }
  ): number {
    const config = this.providerConfigs.get(provider);
    if (!config) return 0;

    // Obter métricas recentes (últimas 24h)
    const stats = performanceMonitor.getProviderStats(24)[provider];

    // Calcular métricas atuais
    const currentLatency = stats?.avgLatency || 2000; // fallback 2s
    const currentCost = stats?.totalCost || 0;
    const reliability = stats?.successRate || 0.95; // fallback 95%
    const concurrentLoad = this.activeRequests.get(provider) || 0;

    // Fatores de pontuação (0-1, maior é melhor)
    const costScore = this.normalizeCostScore(provider, currentCost, userPreferences?.maxCost);
    const latencyScore = this.normalizeLatencyScore(currentLatency, userPreferences?.maxLatency);
    const reliabilityScore = reliability;
    const loadScore = 1 - (concurrentLoad / config.maxConcurrent);
    const priorityScore = 1 / config.priority; // prioridade inversa (1 é melhor)

    // Preferência do usuário
    const preferenceBonus = userPreferences?.preferredProvider === provider ? 0.2 : 0;

    // Pontuação final ponderada
    const finalScore =
      (costScore * config.costWeight) +
      (latencyScore * config.latencyWeight) +
      (reliabilityScore * config.reliabilityWeight) +
      (loadScore * 0.1) + // 10% para carga
      (priorityScore * 0.1) + // 10% para prioridade
      preferenceBonus;

    return Math.max(0, Math.min(1, finalScore)); // Clamp entre 0-1
  }

  private normalizeCostScore(provider: string, currentCost: number, maxCost?: number): number {
    if (maxCost && currentCost > maxCost) return 0; // Excede limite

    // Custo normalizado (menor custo = maior pontuação)
    const baseCosts: Record<string, number> = {
      'ollama': 0,
      'google': 0.001,
      'xai': 0.0012,
      'openai': 0.002,
      'anthropic': 0.0025
    };

    const baseCost = baseCosts[provider] || 0.001;
    return Math.max(0, 1 - (currentCost / baseCost));
  }

  private normalizeLatencyScore(currentLatency: number, maxLatency?: number): number {
    if (maxLatency && currentLatency > maxLatency) return 0; // Excede limite

    // Latência normalizada (menor latência = maior pontuação)
    const optimalLatency = 1000; // 1 segundo é ótimo
    const maxAcceptableLatency = 5000; // 5 segundos é máximo aceitável

    if (currentLatency <= optimalLatency) return 1;
    if (currentLatency >= maxAcceptableLatency) return 0;

    return 1 - ((currentLatency - optimalLatency) / (maxAcceptableLatency - optimalLatency));
  }

  private canAcceptRequest(provider: string): boolean {
    const config = this.providerConfigs.get(provider);
    if (!config) return false;

    const currentLoad = this.activeRequests.get(provider) || 0;
    return currentLoad < config.maxConcurrent;
  }

  private getProviderReason(provider: string, modelType: string): string {
    const config = this.providerConfigs.get(provider);
    const stats = performanceMonitor.getProviderStats(24)[provider];

    const reasons = [];

    if (config) {
      reasons.push(`Priority: ${config.priority}`);
    }

    if (stats) {
      reasons.push(`Avg latency: ${Math.round(stats.avgLatency)}ms`);
      reasons.push(`Success rate: ${(stats.successRate * 100).toFixed(1)}%`);
    }

    reasons.push(`Model type: ${modelType}`);

    return reasons.join(', ');
  }

  private getModelForProvider(provider: string, modelType: 'chat' | 'vision' | 'reasoning' | 'artifact'): string {
    const modelMappings: Record<string, Record<string, string>> = {
      'xai': {
        chat: 'grok-2-1212',
        vision: 'grok-2-vision-1212',
        reasoning: 'grok-3-mini-beta',
        artifact: 'grok-2-1212'
      },
      'anthropic': {
        chat: 'claude-3-5-sonnet',
        vision: 'claude-3-5-sonnet',
        reasoning: 'claude-3-5-sonnet',
        artifact: 'claude-3-5-sonnet'
      },
      'openai': {
        chat: 'gpt-4o',
        vision: 'gpt-4o',
        reasoning: 'gpt-4o',
        artifact: 'gpt-4o'
      },
      'google': {
        chat: 'gemini-pro',
        vision: 'gemini-pro-vision',
        reasoning: 'gemini-pro',
        artifact: 'gemini-pro'
      },
      'ollama': {
        chat: 'qwen3:30b',
        vision: 'llama3.2-vision:latest',
        reasoning: 'qwen3:30b',
        artifact: 'falcon3:latest'
      }
    };

    return modelMappings[provider]?.[modelType] || 'default-model';
  }

  // Métodos para gerenciar carga ativa
  incrementLoad(provider: string) {
    const current = this.activeRequests.get(provider) || 0;
    this.activeRequests.set(provider, current + 1);
  }

  decrementLoad(provider: string) {
    const current = this.activeRequests.get(provider) || 0;
    if (current > 0) {
      this.activeRequests.set(provider, current - 1);
    }
  }

  getActiveLoad(): Record<string, number> {
    return Object.fromEntries(this.activeRequests);
  }

  getProviderConfig(provider: string): ProviderConfig | undefined {
    return this.providerConfigs.get(provider);
  }

  getAllProviderConfigs(): Record<string, ProviderConfig> {
    return Object.fromEntries(this.providerConfigs);
  }
}

// Instância global do load balancer
export const loadBalancer = new LoadBalancer();

// Função helper para usar o load balancer
export async function selectOptimalProvider(
  availableProviders: string[],
  modelType: 'chat' | 'vision' | 'reasoning' | 'artifact' = 'chat',
  userPreferences?: {
    preferredProvider?: string;
    maxCost?: number;
    maxLatency?: number;
  }
): Promise<LoadBalancingDecision> {
  return loadBalancer.selectProvider(availableProviders, modelType, userPreferences);
}