import { performanceMonitor } from '../monitoring/performance';
import { observeHistogram, incrementCounter } from '@/lib/monitoring/metrics';

export type ProviderName = 'openai' | 'anthropic' | 'google' | 'xai' | 'ollama' | 'gateway' | 'mock' | string;

export type ModelType = 'chat' | 'vision' | 'reasoning' | 'artifact';

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

export interface LoadBalancerConfig {
  globalCostWeight: number;
  globalLatencyWeight: number;
  globalReliabilityWeight: number;
  maxCostPerRequest: number;
  maxLatencyMs: number;
  providerTimeoutMs: number;
  providerPriorityOrder: string[];
}

class LoadBalancer {
  private readonly providerConfigs: Map<string, ProviderConfig> = new Map();
  private readonly activeRequests: Map<string, number> = new Map(); // provider -> count
  private config: LoadBalancerConfig;

  constructor() {
    this.config = this.loadConfigFromEnv();
    this.initializeDefaultConfigs();
  }

  private loadConfigFromEnv(): LoadBalancerConfig {
    return {
      globalCostWeight: Number.parseFloat(process.env.LOAD_BALANCER_COST_WEIGHT || '30') / 100,
      globalLatencyWeight: Number.parseFloat(process.env.LOAD_BALANCER_LATENCY_WEIGHT || '40') / 100,
      globalReliabilityWeight: Number.parseFloat(process.env.LOAD_BALANCER_RELIABILITY_WEIGHT || '30') / 100,
      maxCostPerRequest: Number.parseFloat(process.env.MAX_COST_PER_REQUEST || '0.10'),
      maxLatencyMs: Number.parseInt(process.env.MAX_LATENCY_MS || '10000'),
      providerTimeoutMs: Number.parseInt(process.env.PROVIDER_TIMEOUT_MS || '30000'),
      providerPriorityOrder: (process.env.PROVIDER_PRIORITY_ORDER || 'xai,ollama,anthropic,openai,google').split(','),
    };
  }

  updateConfig(newConfig: Partial<LoadBalancerConfig>) {
    this.config = { ...this.config, ...newConfig };
  }

  getConfig(): LoadBalancerConfig {
    return { ...this.config };
  }

  private initializeDefaultConfigs() {
    // Configurações padrão para cada provider usando pesos globais
    const defaultConfigs: Record<string, Omit<ProviderConfig, 'costWeight' | 'latencyWeight' | 'reliabilityWeight'>> = {
      xai: {
        name: 'xAI (Grok)',
        priority: 1,
        maxConcurrent: 10,
        enabled: true,
      },
      anthropic: {
        name: 'Anthropic',
        priority: 2,
        maxConcurrent: 5,
        enabled: true,
      },
      openai: {
        name: 'OpenAI',
        priority: 2,
        maxConcurrent: 8,
        enabled: true,
      },
      google: {
        name: 'Google (Vertex)',
        priority: 3,
        maxConcurrent: 6,
        enabled: true,
      },
      ollama: {
        name: 'Ollama (Local)',
        priority: 4,
        maxConcurrent: 3,
        enabled: true,
      },
    };

    Object.entries(defaultConfigs).forEach(([provider, config]) => {
      this.providerConfigs.set(provider, {
        ...config,
        costWeight: this.config.globalCostWeight,
        latencyWeight: this.config.globalLatencyWeight,
        reliabilityWeight: this.config.globalReliabilityWeight,
      });
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
    modelType: ModelType = 'chat',
    userPreferences?: {
      preferredProvider?: string;
      maxCost?: number;
      maxLatency?: number;
    },
  ): Promise<LoadBalancingDecision> {
    const candidates = availableProviders
      .filter((provider) => {
        const config = this.providerConfigs.get(provider);
        return config?.enabled && this.canAcceptRequest(provider);
      })
      .map((provider) => ({
        provider,
        score: this.calculateProviderScore(
          provider,
          modelType,
          userPreferences,
        ),
        reason: this.getProviderReason(provider, modelType),
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
      alternatives: alternatives.map((alt) => ({
        provider: alt.provider,
        model: this.getModelForProvider(alt.provider, modelType),
        score: alt.score,
        reason: alt.reason,
      })),
    };
  }

  private calculateProviderScore(
    provider: string,
    modelType: ModelType,
    userPreferences?: {
      preferredProvider?: string;
      maxCost?: number;
      maxLatency?: number;
    },
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
    const costScore = this.normalizeCostScore(
      provider,
      currentCost,
      userPreferences?.maxCost,
    );
    const latencyScore = this.normalizeLatencyScore(
      currentLatency,
      userPreferences?.maxLatency,
    );
    const reliabilityScore = reliability;
    const loadScore = 1 - concurrentLoad / config.maxConcurrent;
    const priorityScore = 1 / config.priority; // prioridade inversa (1 é melhor)

    // Preferência do usuário
    const preferenceBonus =
      userPreferences?.preferredProvider === provider ? 0.2 : 0;

    // Pontuação final ponderada
    const finalScore =
      costScore * config.costWeight +
      latencyScore * config.latencyWeight +
      reliabilityScore * config.reliabilityWeight +
      loadScore * 0.1 + // 10% para carga
      priorityScore * 0.1 + // 10% para prioridade
      preferenceBonus;

    return Math.max(0, Math.min(1, finalScore)); // Clamp entre 0-1
  }

  private normalizeCostScore(
    provider: string,
    currentCost: number,
    maxCost?: number,
  ): number {
    if (maxCost && currentCost > maxCost) return 0; // Excede limite

    // Custo normalizado (menor custo = maior pontuação)
    const baseCosts: Record<string, number> = {
      ollama: 0,
      google: 0.001,
      xai: 0.0012,
      openai: 0.002,
      anthropic: 0.0025,
    };

    const baseCost = baseCosts[provider] || 0.001;
    return Math.max(0, 1 - currentCost / baseCost);
  }

  private normalizeLatencyScore(
    currentLatency: number,
    maxLatency?: number,
  ): number {
    if (maxLatency && currentLatency > maxLatency) return 0; // Excede limite

    // Latência normalizada (menor latência = maior pontuação)
    const optimalLatency = 1000; // 1 segundo é ótimo
    const maxAcceptableLatency = 5000; // 5 segundos é máximo aceitável

    if (currentLatency <= optimalLatency) return 1;
    if (currentLatency >= maxAcceptableLatency) return 0;

    return (
      1 -
      (currentLatency - optimalLatency) /
        (maxAcceptableLatency - optimalLatency)
    );
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

  private getModelForProvider(
    provider: string,
    modelType: ModelType,
  ): string {
    const modelMappings: Record<string, Record<string, string>> = {
      xai: {
        chat: 'grok-2-1212',
        vision: 'grok-2-vision-1212',
        reasoning: 'grok-3-mini-beta',
        artifact: 'grok-2-1212',
      },
      anthropic: {
        chat: 'claude-3-5-sonnet',
        vision: 'claude-3-5-sonnet',
        reasoning: 'claude-3-5-sonnet',
        artifact: 'claude-3-5-sonnet',
      },
      openai: {
        chat: 'gpt-4o',
        vision: 'gpt-4o',
        reasoning: 'gpt-4o',
        artifact: 'gpt-4o',
      },
      google: {
        chat: 'gemini-pro',
        vision: 'gemini-pro-vision',
        reasoning: 'gemini-pro',
        artifact: 'gemini-pro',
      },
      ollama: {
        chat: 'qwen3:30b',
        vision: 'llama3.2-vision:latest',
        reasoning: 'qwen3:30b',
        artifact: 'falcon3:latest',
      },
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
  modelType: ModelType = 'chat',
  userPreferences?: {
    preferredProvider?: string;
    maxCost?: number;
    maxLatency?: number;
  },
): Promise<LoadBalancingDecision> {
  return loadBalancer.selectProvider(
    availableProviders,
    modelType,
    userPreferences,
  );
}

export interface RequestPolicy {
  modelType?: ModelType;
  preferredProvider?: ProviderName;
  maxCost?: number; // USD
  maxLatencyMs?: number;
  providers?: ProviderName[]; // optional override provider pool/order
  requestId?: string;
}

/**
 * trackAIRequest wraps a provider call, applying timeout/metrics and returning result.
 * It integrates with monitoring metrics (per provider) and falls back across candidates.
 */
export async function trackAIRequest<T>(
  policy: RequestPolicy,
  fn: (ctx: { provider: ProviderName; model: string; signal: AbortSignal }) => Promise<T>,
  opts: { timeoutMs?: number; costEstimator?: (res: T) => number | undefined } = {},
): Promise<T> {
  const timeoutMs = opts.timeoutMs ?? Number.parseInt(process.env.PROVIDER_TIMEOUT_MS || '30000', 10);
  const modelType = policy.modelType || 'chat';
  const available = Array.isArray(policy.providers) && policy.providers.length > 0
    ? policy.providers
    : (loadBalancer.getConfig().providerPriorityOrder as ProviderName[]);

  // Determine order: preferred first, then LB best + alternatives, then remainder
  let candidates: { provider: ProviderName; model: string }[] = [];
  try {
    const decision = await loadBalancer.selectProvider(available as string[], modelType, {
      preferredProvider: policy.preferredProvider,
      maxCost: policy.maxCost,
      maxLatency: policy.maxLatencyMs,
    });
    candidates.push({ provider: decision.provider, model: decision.model });
    for (const alt of decision.alternatives) {
      candidates.push({ provider: alt.provider, model: alt.model });
    }
    // add any remaining providers in config order
    for (const p of available) {
      if (!candidates.find((c) => c.provider === p)) {
        candidates.push({ provider: p, model: loadBalancer['getModelForProvider'](p as string, modelType) });
      }
    }
  } catch {
    // fallback to config order if selection fails
    candidates = available.map((p) => ({ provider: p, model: loadBalancer['getModelForProvider'](p as string, modelType) }));
  }

  const requestId = policy.requestId || (typeof crypto !== 'undefined' && (crypto as any).randomUUID ? (crypto as any).randomUUID() : Math.random().toString(36).slice(2));
  let lastErr: unknown;
  for (const cand of candidates) {
    const started = Date.now();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      incrementCounter('ai_requests_total', { provider: String(cand.provider), model: cand.model, phase: 'start' });
      const res = await fn({ provider: cand.provider, model: cand.model, signal: controller.signal });
      const dur = Date.now() - started;
      observeHistogram('ai_latency_ms', dur, { provider: String(cand.provider), model: cand.model });
      try { (await import('../monitoring/alerts')).recordAiLatency({ provider: String(cand.provider), model: cand.model }, dur); } catch {}
      incrementCounter('ai_requests_total', { provider: String(cand.provider), model: cand.model, phase: 'ok' });
      // Estimate cost and enforce budget if provided
      const cost = opts.costEstimator ? opts.costEstimator(res) : undefined;
      if (policy.maxCost && typeof cost === 'number' && cost > policy.maxCost) {
        incrementCounter('ai_cost_exceeded_total', { provider: String(cand.provider), model: cand.model });
        throw Object.assign(new Error('cost_exceeded'), { code: 'cost_exceeded', cost });
      }
      return res;
    } catch (err) {
      lastErr = err;
      const dur = Date.now() - started;
      observeHistogram('ai_latency_ms', dur, { provider: String(cand.provider), model: cand.model });
      try { (await import('../monitoring/alerts')).recordAiLatency({ provider: String(cand.provider), model: cand.model }, dur); } catch {}
      let code = (err as any)?.code || (err as any)?.status || (err as any)?.name;
      if ((err as Error).name === 'AbortError') code = 'timeout';
      incrementCounter('ai_requests_total', { provider: String(cand.provider), model: cand.model, phase: String(code || 'error') });
      // Retry on specific errors / fallback to next provider
      const retryable = code === 429 || code === '429' || code === 'timeout' || code === 'ECONNRESET' || code === 'fetch_failed' || code === 'cost_exceeded';
      if (!retryable) break;
      continue;
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastErr ?? new Error('ai_request_failed');
}

/**
 * withModel: Suporte ergonômico: recebe preferências de modelo e executa fn
 * com fallback em cascata (usando trackAIRequest por baixo dos panos).
 */
export async function withModel<T>(
  prefs: RequestPolicy,
  fn: (ctx: { provider: ProviderName; model: string; signal: AbortSignal }) => Promise<T>,
  opts?: { timeoutMs?: number; costEstimator?: (res: T) => number | undefined },
): Promise<T> {
  return trackAIRequest(prefs, fn, opts);
}
