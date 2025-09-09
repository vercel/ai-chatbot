import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import React from 'react';
// Note: Using mock implementations for demonstration - replace with actual imports when available
// import { FinancialAnalysisCard } from '../../../packages/ui-cards/FinancialAnalysisCard';
// import { TechnicalFeasibilityCard } from '../../../packages/ui-cards/TechnicalFeasibilityCard';
// import { AnomaliesCard } from '../../../packages/ui-cards/AnomaliesCard';

// Mock data for FinancialAnalysisCard
const mockFinancialData = {
  base: { tariff: 100, losses: 0.1, years: 5 },
  optimistic: { tariff: 120, losses: 0.05, years: 5 },
  pessimistic: { tariff: 80, losses: 0.15, years: 5 },
};

// Mock data for TechnicalFeasibilityCard
const mockTechnicalData = {
  roof_suitability: 'Excelente',
  site_constraints: ['Área adequada', 'Orientação solar ideal', 'Estrutura sólida'],
  utility_rules: [
    'Conexão à rede autorizada',
    'Capacidade de geração dentro dos limites',
    'Documentação completa aprovada'
  ],
  viability_score: 92,
};

// Mock data for AnomaliesCard
const mockAnomaliesData = {
  anomalies: [
    { feature: 'Consumo mensal', score: 0.85, type: 'Normal' },
    { feature: 'Variação sazonal', score: 0.12, type: 'Anômalo' },
    { feature: 'Padrão diário', score: 0.78, type: 'Normal' },
    { feature: 'Pico de demanda', score: 0.95, type: 'Normal' },
    { feature: 'Fator de potência', score: 0.03, type: 'Crítico' },
  ],
  thresholds: { lower: 0.1, upper: 0.9 },
};

// Mock data for BOMCard
const mockBOMData = {
  components: [
    { name: 'Painel Solar 400W', quantity: 12, unitCost: 250, totalCost: 3000 },
    { name: 'Inversor 5kW', quantity: 1, unitCost: 1200, totalCost: 1200 },
    { name: 'Estrutura de Montagem', quantity: 1, unitCost: 800, totalCost: 800 },
    { name: 'Cabeamento', quantity: 100, unitCost: 5, totalCost: 500 },
  ],
  totalCost: 5500,
  currency: 'BRL',
};

// Mock data for ConsumptionCard
const mockConsumptionData = {
  monthlyConsumption: [
    { month: 'Jan', kwh: 450 },
    { month: 'Fev', kwh: 420 },
    { month: 'Mar', kwh: 480 },
    { month: 'Abr', kwh: 390 },
    { month: 'Mai', kwh: 360 },
    { month: 'Jun', kwh: 340 },
  ],
  averageMonthly: 407,
  peakDemand: 8.5,
  offPeakUsage: 65,
};

// Mock data for IntentCard
const mockIntentData = {
  intent: 'Instalação residencial',
  confidence: 0.89,
  keywords: ['casa', 'residencial', 'economia', 'sustentável'],
  category: 'Residencial',
  urgency: 'Alta',
};

// Mock data for MarketDataCard
const mockMarketData = {
  region: 'Sudeste',
  averageCostPerWatt: 4.50,
  marketTrend: 'Crescente',
  competitorPrices: [4.20, 4.35, 4.60, 4.75],
  demandIndex: 0.78,
  supplyIndex: 0.65,
};

// Mock data for PanelDetectionCard
const mockPanelDetectionData = {
  detectedPanels: 14,
  totalArea: 28.5,
  efficiency: 0.85,
  orientation: 'Sul',
  tilt: 25,
  shading: 0.05,
  confidence: 0.92,
};

// Mock data for ProposalCard
const mockProposalData = {
  systemSize: 5.6,
  estimatedCost: 28000,
  paybackPeriod: 7.2,
  annualSavings: 3800,
  co2Reduction: 3200,
  warranty: '25 anos',
  roi: 18.5,
};

// Mock data for RiskScoreCard
const mockRiskData = {
  overallScore: 72,
  riskFactors: [
    { factor: 'Condições climáticas', score: 85, weight: 0.3 },
    { factor: 'Estrutura do telhado', score: 65, weight: 0.25 },
    { factor: 'Regulamentação local', score: 78, weight: 0.2 },
    { factor: 'Disponibilidade de materiais', score: 92, weight: 0.15 },
    { factor: 'Condições econômicas', score: 58, weight: 0.1 },
  ],
  recommendations: [
    'Avaliação estrutural recomendada',
    'Monitoramento climático contínuo',
    'Backup regulatório adicional'
  ],
};

const meta: Meta = {
  title: 'UI Cards/Business Cards',
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Conjunto abrangente de cards de negócio para o sistema YSH de energia solar, cobrindo análise financeira, viabilidade técnica, detecção de anomalias e muito mais.',
      },
    },
  },
  argTypes: {
    theme: {
      control: { type: 'select' },
      options: ['light', 'dark'],
      description: 'Tema visual do componente',
    },
  },
};

export default meta;
type Story = StoryObj;

// Financial Analysis Stories
export const FinancialAnalysisBase: Story = {
	render: () => (
		<div className="space-y-4">
			<h3 className="text-lg font-semibold">
				Análise Financeira - Cenário Base
			</h3>
			<div>Financial Analysis Card Placeholder</div>
		</div>
	),
};

export const FinancialAnalysisOptimistic: Story = {
	render: () => (
		<div className="space-y-4">
			<h3 className="text-lg font-semibold">
				Análise Financeira - Cenário Otimista
			</h3>
			<div>Financial Analysis Card Placeholder</div>
		</div>
	),
};

export const FinancialAnalysisPessimistic: Story = {
	render: () => (
		<div className="space-y-4">
			<h3 className="text-lg font-semibold">
				Análise Financeira - Cenário Pessimista
			</h3>
			<div>Financial Analysis Card Placeholder</div>
		</div>
	),
};

// Technical Feasibility Stories
export const TechnicalFeasibilityHighScore: Story = {
	render: () => (
		<div className="space-y-4">
			<h3 className="text-lg font-semibold">
				Viabilidade Técnica - Score Alto
			</h3>
			<div>Technical Feasibility Card Placeholder</div>
		</div>
	),
};

export const TechnicalFeasibilityMediumScore: Story = {
	render: () => (
		<div className="space-y-4">
			<h3 className="text-lg font-semibold">
				Viabilidade Técnica - Score Médio
			</h3>
			<div>Technical Feasibility Card Placeholder</div>
		</div>
	),
};

export const TechnicalFeasibilityLowScore: Story = {
	render: () => (
		<div className="space-y-4">
			<h3 className="text-lg font-semibold">
				Viabilidade Técnica - Score Baixo
			</h3>
			<div>Technical Feasibility Card Placeholder</div>
		</div>
	),
};

// Anomalies Detection Stories
export const AnomaliesNormal: Story = {
	render: () => (
		<div className="space-y-4">
			<h3 className="text-lg font-semibold">Detecção de Anomalias - Normal</h3>
			<div>Anomalies Card Placeholder</div>
		</div>
	),
};

export const AnomaliesWithOutliers: Story = {
	render: () => (
		<div className="space-y-4">
			<h3 className="text-lg font-semibold">
				Detecção de Anomalias - Com Outliers
			</h3>
			<div>Anomalies Card Placeholder</div>
		</div>
	),
};

// Business Cards Overview
export const BusinessCardsOverview: Story = {
	render: () => (
		<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
			<div className="space-y-2">
				<h4 className="font-semibold">Análise Financeira</h4>
				<div>Financial Analysis Card Placeholder</div>
			</div>

			<div className="space-y-2">
				<h4 className="font-semibold">Viabilidade Técnica</h4>
				<div>Technical Feasibility Card Placeholder</div>
			</div>

			<div className="space-y-2">
				<h4 className="font-semibold">Detecção de Anomalias</h4>
				<div>Anomalies Card Placeholder</div>
			</div>

			<div className="space-y-2">
				<h4 className="font-semibold">Consumo de Energia</h4>
				<div className="p-4 border rounded">
					<div className="text-sm">
						<div>
							Consumo Médio: {mockConsumptionData.averageMonthly} kWh/mês
						</div>
						<div>Demanda de Pico: {mockConsumptionData.peakDemand} kW</div>
					</div>
				</div>
			</div>

			<div className="space-y-2">
				<h4 className="font-semibold">Dados de Mercado</h4>
				<div className="p-4 border rounded">
					<div className="text-sm">
						<div>Região: {mockMarketData.region}</div>
						<div>Custo Médio: R$ {mockMarketData.averageCostPerWatt}/W</div>
						<div>Tendência: {mockMarketData.marketTrend}</div>
					</div>
				</div>
			</div>

			<div className="space-y-2">
				<h4 className="font-semibold">Detecção de Painéis</h4>
				<div className="p-4 border rounded">
					<div className="text-sm">
						<div>
							Painéis Detectados: {mockPanelDetectionData.detectedPanels}
						</div>
						<div>Área Total: {mockPanelDetectionData.totalArea} m²</div>
						<div>
							Eficiência: {(mockPanelDetectionData.efficiency * 100).toFixed(1)}
							%
						</div>
					</div>
				</div>
			</div>
		</div>
	),
	parameters: {
		docs: {
			description: {
				story:
					"Visão geral de todos os principais cards de negócio em um layout de grid responsivo.",
			},
		},
	},
};

// Loading States
export const LoadingStates: Story = {
  render: () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-2">
        <h4 className="font-semibold">Carregando Análise Financeira</h4>
        <div className="p-4 border rounded animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
          <div className="h-32 bg-gray-200 rounded mb-4" />
          <div className="space-y-2">
            <div className="h-3 bg-gray-200 rounded" />
            <div className="h-3 bg-gray-200 rounded w-5/6" />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <h4 className="font-semibold">Carregando Viabilidade Técnica</h4>
        <div className="p-4 border rounded animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/2 mb-4" />
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded" />
            <div className="h-4 bg-gray-200 rounded w-4/5" />
            <div className="h-4 bg-gray-200 rounded w-3/5" />
          </div>
        </div>
      </div>
    </div>
  ),
};

// Error States
export const ErrorStates: Story = {
	render: () => (
		<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
			<div className="space-y-2">
				<h4 className="font-semibold">Erro na Análise Financeira</h4>
				<div className="p-4 border border-red-300 rounded bg-red-50">
					<div className="text-red-600 text-sm mb-2">
						❌ Erro ao carregar dados financeiros
					</div>
					<button
						type="button"
						className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
					>
						Tentar Novamente
					</button>
				</div>
			</div>

			<div className="space-y-2">
				<h4 className="font-semibold">Erro na Viabilidade Técnica</h4>
				<div className="p-4 border border-red-300 rounded bg-red-50">
					<div className="text-red-600 text-sm mb-2">
						❌ Falha na análise técnica
					</div>
					<button
						type="button"
						className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
					>
						Tentar Novamente
					</button>
				</div>
			</div>
		</div>
	),
};

// Mobile Responsive
export const MobileResponsive: Story = {
	parameters: {
		viewport: {
			defaultViewport: "mobile1",
		},
	},
	render: () => (
		<div className="space-y-4 p-4">
			<h3 className="text-lg font-semibold">Cards em Dispositivo Móvel</h3>

			<div className="space-y-4">
				<div>Financial Analysis Card Placeholder</div>
				<div>Technical Feasibility Card Placeholder</div>
				<div>Anomalies Card Placeholder</div>
			</div>
		</div>
	),
};

// Accessibility
export const Accessibility: Story = {
	render: () => (
		<div className="space-y-6">
			<h3 className="text-lg font-semibold">
				Cards com Acessibilidade Aprimorada
			</h3>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
				<div className="space-y-2">
					<h4 className="font-semibold">Análise Financeira (Screen Reader)</h4>
					<div>Financial Analysis Card Placeholder</div>
				</div>

				<div className="space-y-2">
					<h4 className="font-semibold">Viabilidade Técnica (High Contrast)</h4>
					<div>Technical Feasibility Card Placeholder</div>
				</div>
			</div>

			<div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded">
				<h4 className="font-semibold text-blue-800 mb-2">
					Recursos de Acessibilidade:
				</h4>
				<ul className="text-sm text-blue-700 space-y-1">
					<li>• Labels ARIA para todos os controles interativos</li>
					<li>• Navegação por teclado completa</li>
					<li>• Contraste de cores adequado</li>
					<li>• Descrições alternativas para gráficos</li>
					<li>• Estrutura semântica HTML</li>
				</ul>
			</div>
		</div>
	),
	parameters: {
		a11y: {
			test: "todo",
		},
	},
};