/**
 * Página de monitoramento de performance do sistema de load balancing
 * Demonstra como usar o componente PerformanceDashboard
 */

import { PerformanceDashboard } from '@/components/performance-dashboard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, TrendingUp, Users, Zap } from 'lucide-react';

export default function MonitoringPage() {
  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Preload monitoring API data to warm cache */}
      {/* eslint-disable-next-line @next/next/no-sync-scripts */}
      <link rel="preload" href="/api/monitoring/performance" as="fetch" crossOrigin="anonymous" />
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Monitoramento de Performance</h1>
          <p className="text-muted-foreground mt-2">
            Acompanhe o desempenho dos providers de IA em tempo real
          </p>
        </div>
        <Badge variant="secondary" className="text-sm">
          <Activity className="size-4 mr-1" />
          Sistema Ativo
        </Badge>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Providers</CardTitle>
            <Users className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5</div>
            <p className="text-xs text-muted-foreground">
              +2 desde o último mês
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Média de Latência</CardTitle>
            <Zap className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">245ms</div>
            <p className="text-xs text-muted-foreground">
              -12% em relação à semana passada
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Sucesso</CardTitle>
            <TrendingUp className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">96.8%</div>
            <p className="text-xs text-muted-foreground">
              +0.5% em relação ao mês passado
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Custo Total (24h)</CardTitle>
            <Activity className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$2.34</div>
            <p className="text-xs text-muted-foreground">
              -8% em relação à semana passada
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard */}
      <Card>
        <CardHeader>
          <CardTitle>Dashboard de Performance</CardTitle>
          <CardDescription>
            Métricas em tempo real dos providers de IA com atualização automática a cada 30 segundos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PerformanceDashboard autoRefreshInterval={30000} />
        </CardContent>
      </Card>

      {/* Settings Section */}
      <Card>
        <CardHeader>
          <CardTitle>Configurações do Dashboard</CardTitle>
          <CardDescription>
            Personalize o comportamento do monitoramento
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="refresh-interval" className="text-sm font-medium">Intervalo de Atualização</label>
              <select id="refresh-interval" className="w-full p-2 border rounded-md">
                <option value="15000">15 segundos</option>
                <option value="30000">30 segundos</option>
                <option value="60000">1 minuto</option>
                <option value="300000">5 minutos</option>
              </select>
            </div>
            <div className="space-y-2">
              <label htmlFor="analysis-period" className="text-sm font-medium">Período de Análise</label>
              <select id="analysis-period" className="w-full p-2 border rounded-md">
                <option value="1">Última hora</option>
                <option value="24">Últimas 24 horas</option>
                <option value="168">Última semana</option>
                <option value="720">Último mês</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
