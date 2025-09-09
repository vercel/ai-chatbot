/**
 * Dashboard de monitoramento de performance do sistema de load balancing
 * Exibe métricas em tempo real dos providers de IA
 */

import React from 'react';
import { usePerformanceMonitoring } from '@/hooks/use-load-balancing';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, CheckCircle, Clock, DollarSign, Zap, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ProviderMetricsCardProps {
  readonly provider: string;
  readonly stats: {
    totalRequests: number;
    avgLatency: number;
    successRate: number;
    totalCost: number;
    errorRate: number;
  };
}

function ProviderMetricsCard({ provider, stats }: ProviderMetricsCardProps) {
  const getStatusColor = (successRate: number) => {
    if (successRate >= 0.95) return 'text-green-600';
    if (successRate >= 0.85) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusIcon = (successRate: number) => {
    if (successRate >= 0.95) return <CheckCircle className="size-4 text-green-600" />;
    if (successRate >= 0.85) return <Clock className="size-4 text-yellow-600" />;
    return <AlertCircle className="size-4 text-red-600" />;
  };

  const getBadgeVariant = (successRate: number) => {
    if (successRate >= 0.95) return 'default';
    if (successRate >= 0.85) return 'secondary';
    return 'destructive';
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold capitalize">{provider}</CardTitle>
          <div className="flex items-center gap-2">
            {getStatusIcon(stats.successRate)}
            <Badge variant={getBadgeVariant(stats.successRate)}>
              {(stats.successRate * 100).toFixed(1)}%
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Zap className="size-4" />
              Latência Média
            </div>
            <div className="text-2xl font-bold">{Math.round(stats.avgLatency)}ms</div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <DollarSign className="size-4" />
              Custo Total
            </div>
            <div className="text-2xl font-bold">${stats.totalCost.toFixed(4)}</div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Taxa de Sucesso</span>
            <span className={getStatusColor(stats.successRate)}>
              {(stats.successRate * 100).toFixed(1)}%
            </span>
          </div>
          <Progress value={stats.successRate * 100} className="h-2" />
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
          <div>
            <div className="font-medium">Total de Requisições</div>
            <div className="text-lg font-semibold text-foreground">{stats.totalRequests}</div>
          </div>
          <div>
            <div className="font-medium">Taxa de Erro</div>
            <div className="text-lg font-semibold text-foreground">
              {(stats.errorRate * 100).toFixed(1)}%
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface PerformanceDashboardProps {
  readonly autoRefreshInterval?: number;
  readonly className?: string;
}

export function PerformanceDashboard({
  autoRefreshInterval = 30000, // 30 segundos
  className = ''
}: PerformanceDashboardProps) {
  const { metrics, isLoading, error, refresh } = usePerformanceMonitoring(autoRefreshInterval);

  if (isLoading && !metrics) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Monitoramento de Performance</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {['skeleton-1', 'skeleton-2', 'skeleton-3', 'skeleton-4', 'skeleton-5'].map((key) => (
            <Card key={key} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-muted rounded"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="h-4 bg-muted rounded"></div>
                  <div className="h-4 bg-muted rounded"></div>
                  <div className="h-4 bg-muted rounded"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Monitoramento de Performance</h2>
          <Button onClick={() => refresh()} variant="outline" size="sm">
            <RefreshCw className="size-4 mr-2" />
            Tentar Novamente
          </Button>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Erro ao carregar métricas: {error}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Monitoramento de Performance</h2>
          <Button onClick={() => refresh()} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Carregar Métricas
          </Button>
        </div>
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Nenhuma métrica disponível. Clique em "Carregar Métricas" para buscar dados.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const { providerStats, totalStats } = metrics;

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Monitoramento de Performance</h2>
          <p className="text-muted-foreground">
            Métricas em tempo real dos providers de IA (últimas 24h)
          </p>
        </div>
        <Button onClick={() => refresh()} variant="outline" size="sm" disabled={isLoading}>
          <RefreshCw className={`size-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          {isLoading ? 'Atualizando...' : 'Atualizar'}
        </Button>
      </div>

      {/* Métricas Gerais */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total de Requisições</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStats.totalRequests}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Latência Média</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(totalStats.avgLatency)}ms</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Sucesso</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(totalStats.successRate * 100).toFixed(1)}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Custo Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalStats.totalCost.toFixed(4)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Métricas por Provider */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Performance por Provider</h3>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Object.entries(providerStats).map(([provider, stats]) => (
            <ProviderMetricsCard key={provider} provider={provider} stats={stats} />
          ))}
        </div>
      </div>

      {/* Última atualização */}
      <div className="text-sm text-muted-foreground text-center">
        Última atualização: {new Date().toLocaleString('pt-BR')}
      </div>
    </div>
  );
}

export default PerformanceDashboard;