'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import {
  loadBalancingService,
  LoadBalancingOptions,
  LoadBalancingResult,
  PerformanceMetrics,
} from '@/lib/services/load-balancing-service';
import { LoadBalancingDecision, ModelType } from '@/lib/load-balancing/load-balancer';

export interface UseLoadBalancingReturn {
  selectedProvider: LoadBalancingDecision | null;
  isLoading: boolean;
  error: string | null;
  metrics: PerformanceMetrics['data'] | null;
  metricsLoading: boolean;
  metricsError: string | null;
  selectProvider: (options?: LoadBalancingOptions) => Promise<void>;
  refreshMetrics: (hours?: number) => Promise<void>;
  clearError: () => void;
}

export function useLoadBalancing(): UseLoadBalancingReturn {
  const [selectedProvider, setSelectedProvider] = useState<LoadBalancingDecision | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<PerformanceMetrics['data'] | null>(null);
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [metricsError, setMetricsError] = useState<string | null>(null);

  const service = useMemo(() => loadBalancingService, []);

  const selectProvider = useCallback(async (options: LoadBalancingOptions = {}) => {
    setIsLoading(true);
    setError(null);

    try {
      const result: LoadBalancingResult = await service.selectProvider(options);

      if (result.success && result.data) {
        setSelectedProvider(result.data);
      } else {
        setError(result.error || 'Erro na seleção');
        setSelectedProvider(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro');
      setSelectedProvider(null);
    } finally {
      setIsLoading(false);
    }
  }, [service]);

  const refreshMetrics = useCallback(async (hours: number = 24) => {
    setMetricsLoading(true);
    setMetricsError(null);

    try {
      const result: PerformanceMetrics = await service.getPerformanceMetrics(hours);

      if (result.success && result.data) {
        setMetrics(result.data);
      } else {
        setMetricsError(result.error || 'Erro nas métricas');
        setMetrics(null);
      }
    } catch (err) {
      setMetricsError(err instanceof Error ? err.message : 'Erro');
      setMetrics(null);
    } finally {
      setMetricsLoading(false);
    }
  }, [service]);

  const clearError = useCallback(() => {
    setError(null);
    setMetricsError(null);
  }, []);

  // Carregar métricas iniciais
  useEffect(() => {
    refreshMetrics();
  }, [refreshMetrics]);

  return {
    selectedProvider,
    isLoading,
    error,
    metrics,
    metricsLoading,
    metricsError,
    selectProvider,
    refreshMetrics,
    clearError,
  };
}

export function useProviderSelection(modelType: ModelType = 'chat') {
  const { selectedProvider, isLoading, error, selectProvider } = useLoadBalancing();

  const selectForModel = useCallback(async (options: Omit<LoadBalancingOptions, 'modelType'> = {}) => {
    await selectProvider({ ...options, modelType });
  }, [selectProvider, modelType]);

  return {
    provider: selectedProvider?.provider || null,
    model: selectedProvider?.model || null,
    score: selectedProvider?.score || 0,
    reason: selectedProvider?.reason || null,
    alternatives: selectedProvider?.alternatives || [],
    isLoading,
    error,
    selectProvider: selectForModel,
  };
}

export function usePerformanceMonitoring(autoRefreshInterval?: number) {
  const { metrics, metricsLoading, metricsError, refreshMetrics } = useLoadBalancing();

  // Auto-refresh se intervalo for especificado
  useEffect(() => {
    if (!autoRefreshInterval) return;

    const interval = setInterval(() => {
      refreshMetrics();
    }, autoRefreshInterval);

    return () => clearInterval(interval);
  }, [autoRefreshInterval, refreshMetrics]);

  return {
    metrics,
    isLoading: metricsLoading,
    error: metricsError,
    refresh: refreshMetrics,
  };
}
