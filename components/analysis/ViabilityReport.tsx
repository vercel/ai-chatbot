"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  TrendingUp,
  DollarSign,
  Calendar,
  Target,
  CheckCircle,
  AlertTriangle,
  Download,
  Share2,
  Phone,
  Mail
} from "lucide-react";
import { usePersona } from "@/lib/persona/context";
import { type ViabilityResult } from "@/lib/analysis/types";

// Props do componente
interface ViabilityReportProps {
  readonly result: ViabilityResult;
  readonly onNewAnalysis?: () => void;
  readonly onExport?: () => void;
  readonly onShare?: () => void;
  readonly onContact?: () => void;
}

/**
 * Componente ViabilityReport - Relatório de análise de viabilidade
 * Mostra KPIs, gráfico SVG e CTAs apropriadas por persona
 */
export function ViabilityReport({
  result,
  onNewAnalysis,
  onExport,
  onShare,
  onContact
}: ViabilityReportProps) {
  const { mode } = usePersona();
  const [showDetails, setShowDetails] = useState(false);

  // Cálculo da viabilidade baseado no payback
  const getViabilityStatus = () => {
    const payback = result.estimates.payback_years;
    if (payback <= 5) return { status: "excellent", label: "Excelente", color: "bg-green-500" };
    if (payback <= 8) return { status: "good", label: "Bom", color: "bg-blue-500" };
    if (payback <= 12) return { status: "fair", label: "Razoável", color: "bg-yellow-500" };
    return { status: "poor", label: "Não recomendado", color: "bg-red-500" };
  };

  const viability = getViabilityStatus();

  // Dados para o gráfico de barras
  const chartData = [
    { label: "Economia Mensal", value: result.estimates.savings_month, color: "#10b981" },
    { label: "Conta Atual", value: result.estimates.bill_now, color: "#ef4444" },
  ];

  // Função para renderizar gráfico SVG simples
  const renderBarChart = () => {
    const maxValue = Math.max(...chartData.map(d => d.value));
    const chartHeight = 200;
    const chartWidth = 300;
    const barWidth = 60;
    const barSpacing = 40;

    return (
      <svg width={chartWidth} height={chartHeight} className="border rounded-lg p-4" aria-label="Comparação Financeira - Conta Atual vs Economia Projetada">
        <title>Comparação Financeira - Conta Atual vs Economia Projetada</title>
        {/* Eixos */}
        <line x1="40" y1="20" x2="40" y2={chartHeight - 40} stroke="#e5e7eb" strokeWidth="2" />
        <line x1="40" y1={chartHeight - 40} x2={chartWidth - 20} y2={chartHeight - 40} stroke="#e5e7eb" strokeWidth="2" />

        {/* Barras */}
        {chartData.map((data, index) => {
          const barHeight = (data.value / maxValue) * (chartHeight - 80);
          const x = 60 + index * (barWidth + barSpacing);
          const y = chartHeight - 40 - barHeight;

          return (
            <g key={data.label}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                fill={data.color}
                className="transition-all hover:opacity-80"
              />
              <text
                x={x + barWidth / 2}
                y={y - 10}
                textAnchor="middle"
                className="text-xs font-medium fill-gray-700"
              >
                R$ {Math.round(data.value).toLocaleString('pt-BR')}
              </text>
              <text
                x={x + barWidth / 2}
                y={chartHeight - 20}
                textAnchor="middle"
                className="text-xs fill-gray-500"
              >
                {data.label}
              </text>
            </g>
          );
        })}
      </svg>
    );
  };

  // Renderização condicional baseada na persona
  const renderPersonaContent = () => {
    if (mode === "owner") {
      return (
        <div className="space-y-6">
          {/* Status da viabilidade */}
          <Alert className={`${viability.color} text-white border-0`}>
            <CheckCircle className="size-4" />
            <AlertDescription className="font-medium">
              Viabilidade: {viability.label}
            </AlertDescription>
          </Alert>

          {/* KPIs principais */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="size-5 text-green-600" />
                  <div>
                    <p className="text-sm text-gray-600">Economia mensal</p>
                    <p className="text-2xl font-bold text-green-600">
                      R$ {Math.round(result.estimates.savings_month).toLocaleString('pt-BR')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Calendar className="size-5 text-blue-600" />
                  <div>
                    <p className="text-sm text-gray-600">Payback</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {Math.round(result.estimates.payback_years * 10) / 10} anos
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="size-5 text-purple-600" />
                  <div>
                    <p className="text-sm text-gray-600">ROI em 5 anos</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {Math.round(result.estimates.roi_5y * 100)}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Gráfico */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Comparação Financeira</CardTitle>
              <CardDescription>
                Comparação entre conta atual e economia projetada
              </CardDescription>
            </CardHeader>
            <CardContent>
              {renderBarChart()}
            </CardContent>
          </Card>

          {/* Recomendação */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <Target className="size-6 text-green-600 mt-1" />
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-2">Recomendação</h3>
                  <p className="text-gray-700 mb-4">
                    Com base na sua análise, recomendamos prosseguir com a instalação de
                    um sistema de {Math.round(result.estimates.estimated_kwp * 10) / 10} kWp.
                    O investimento de R$ {Math.round(result.estimates.capex).toLocaleString('pt-BR')}
                    será recuperado em aproximadamente {Math.round(result.estimates.payback_years * 10) / 10} anos.
                  </p>
                  <div className="flex gap-2">
                    <Badge variant="secondary">Geração: {Math.round(result.estimates.gen_month)} kWh/mês</Badge>
                    <Badge variant="secondary">CAPEX: R$ {Math.round(result.estimates.capex).toLocaleString('pt-BR')}</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* CTAs para owner */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button onClick={onContact} className="flex items-center gap-2">
              <Phone className="size-4" />
              Falar com especialista
            </Button>
            <Button variant="outline" onClick={onNewAnalysis}>
              Nova análise
            </Button>
            <Button variant="outline" onClick={onExport}>
              <Download className="size-4" />
              Exportar relatório
            </Button>
          </div>
        </div>
      );
    }

    // Integrator persona
    return (
      <div className="space-y-6">
        {/* Status técnico */}
        <Alert className="border-blue-200 bg-blue-50">
          <AlertTriangle className="size-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            Análise técnica completa realizada. Consulte detalhes abaixo.
          </AlertDescription>
        </Alert>

        {/* KPIs técnicos */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-sm text-gray-600">Sistema recomendado</p>
                <p className="text-2xl font-bold text-blue-600">
                  {Math.round(result.estimates.estimated_kwp * 10) / 10} kWp
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-sm text-gray-600">Geração mensal</p>
                <p className="text-2xl font-bold text-green-600">
                  {Math.round(result.estimates.gen_month)} kWh
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-sm text-gray-600">CAPEX estimado</p>
                <p className="text-2xl font-bold text-orange-600">
                  R$ {Math.round(result.estimates.capex).toLocaleString('pt-BR')}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-sm text-gray-600">Payback</p>
                <p className="text-2xl font-bold text-purple-600">
                  {Math.round(result.estimates.payback_years * 10) / 10} anos
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detalhes técnicos */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Parâmetros Técnicos</CardTitle>
            <CardDescription>
              Assunções e cálculos utilizados na análise
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900">Assunções do Sistema</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Performance Ratio:</span>
                    <span className="font-medium">{result.assumptions.PR * 100}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Irradiação média:</span>
                    <span className="font-medium">{result.assumptions.kwh_per_kwp_month} kWh/kWp/mês</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">CAPEX por kWp:</span>
                    <span className="font-medium">R$ {result.assumptions.capex_per_kwp.toLocaleString('pt-BR')}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium text-gray-900">Dados de Entrada</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Consumo médio:</span>
                    <span className="font-medium">{result.inputs.avg_kwh_month} kWh/mês</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tarifa atual:</span>
                    <span className="font-medium">R$ {result.inputs.tariff_rs_kwh}/kWh</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Estado:</span>
                    <span className="font-medium">{result.inputs.uf || 'N/A'}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Gráfico de comparação */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Análise Financeira</CardTitle>
          </CardHeader>
          <CardContent>
            {renderBarChart()}
          </CardContent>
        </Card>

        {/* CTAs para integrator */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Button onClick={onContact} className="flex items-center gap-2">
            <Mail className="size-4" />
            Enviar proposta
          </Button>
          <Button variant="outline" onClick={onNewAnalysis}>
            Nova análise
          </Button>
          <Button variant="outline" onClick={onExport}>
            <Download className="size-4" />
            Exportar dados
          </Button>
          <Button variant="outline" onClick={onShare}>
            <Share2 className="size-4" />
            Compartilhar
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Cabeçalho */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Relatório de Viabilidade</CardTitle>
              <CardDescription>
                Análise completa para sistema fotovoltaico
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-lg px-3 py-1">
              {viability.label}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Conteúdo principal */}
      {renderPersonaContent()}

      {/* Toggle para detalhes adicionais */}
      <Card>
        <CardContent className="p-4">
          <Button
            variant="ghost"
            onClick={() => setShowDetails(!showDetails)}
            className="w-full justify-start"
          >
            {showDetails ? "Ocultar" : "Mostrar"} detalhes técnicos
          </Button>

          {showDetails && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <pre className="text-xs text-gray-700 whitespace-pre-wrap">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}