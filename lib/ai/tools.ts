/**
 * Sistema de Tools para Agentes de IA
 * Define ferramentas reutilizáveis que os agentes podem executar
 */

// Tipos base para tools
export interface ToolParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description: string;
  required?: boolean;
  enum?: string[];
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: ToolParameter[];
  execute: (params: Record<string, any>) => Promise<any>;
  category: ToolCategory;
  capabilities: string[]; // Capabilities necessárias para usar esta tool
}

export type ToolCategory =
  | 'solar-analysis'
  | 'financial-modeling'
  | 'roof-detection'
  | 'energy-calculation'
  | 'data-processing'
  | 'web-search'
  | 'file-processing'
  | 'communication'
  | 'utility';

// Tool para análise de viabilidade solar
export const solarViabilityTool: ToolDefinition = {
  name: 'analyze_solar_viability',
  description: 'Analisa a viabilidade de instalação de sistema solar baseado em localização, consumo e orçamento',
  category: 'solar-analysis',
  capabilities: ['solar-analysis', 'financial-modeling'],
  parameters: [
    {
      name: 'location',
      type: 'string',
      description: 'Localização da propriedade (endereço completo)',
      required: true,
    },
    {
      name: 'monthlyConsumption',
      type: 'number',
      description: 'Consumo mensal de energia em kWh',
      required: true,
    },
    {
      name: 'budget',
      type: 'number',
      description: 'Orçamento disponível para investimento',
      required: false,
    },
    {
      name: 'roofType',
      type: 'string',
      description: 'Tipo de telhado (cerâmico, metálico, fibrocimento, etc.)',
      required: false,
    },
  ],
  execute: async (params) => {
    // Simulação de análise solar
    const { location, monthlyConsumption, budget = 0, roofType = 'cerâmico' } = params;

    // Cálculos simulados
    const solarIrradiation = 5.2; // kWh/m²/dia (média Brasil)
    const systemEfficiency = 0.85;
    const panelPower = 550; // Wp
    const panelArea = 2.2; // m²

    // Estimativa de produção mensal
    const estimatedProduction = monthlyConsumption * 1.1; // 10% margem de segurança
    const requiredPower = (estimatedProduction * 1000) / (30 * solarIrradiation * 24 * systemEfficiency);
    const panelsNeeded = Math.ceil(requiredPower / panelPower);
    const requiredArea = panelsNeeded * panelArea;

    // Estimativa de custos
    const costPerWp = 2.5; // R$/Wp
    const totalCost = requiredPower * costPerWp;
    const paybackYears = totalCost / (monthlyConsumption * 0.7 * 12); // 70% economia

    return {
      location,
      analysis: {
        estimatedProduction,
        requiredPower,
        panelsNeeded,
        requiredArea,
        totalCost,
        paybackYears,
        monthlySavings: monthlyConsumption * 0.7,
        viability: budget > 0 ? (totalCost <= budget ? 'viable' : 'not_viable') : 'needs_budget_check',
      },
      recommendations: [
        `Sistema de ${requiredPower.toFixed(0)} kWp necessário`,
        `Área de telhado necessária: ${requiredArea.toFixed(0)} m²`,
        `Retorno do investimento em ${paybackYears.toFixed(1)} anos`,
        roofType === 'cerâmico' ? 'Telhado adequado para instalação' : 'Verificar adequação do telhado',
      ],
    };
  },
};

// Tool para detecção de telhado via imagem
export const roofDetectionTool: ToolDefinition = {
  name: 'detect_roof_features',
  description: 'Analisa imagem de telhado para detectar características e viabilidade de instalação solar',
  category: 'roof-detection',
  capabilities: ['roof-detection', 'image-analysis'],
  parameters: [
    {
      name: 'imageUrl',
      type: 'string',
      description: 'URL da imagem do telhado',
      required: true,
    },
    {
      name: 'imageDescription',
      type: 'string',
      description: 'Descrição adicional da imagem',
      required: false,
    },
  ],
  execute: async (params) => {
    const { imageUrl, imageDescription = '' } = params;

    // Simulação de análise de imagem
    const mockAnalysis = {
      roofType: 'cerâmico',
      orientation: 'sul',
      inclination: 25,
      area: 120,
      obstructions: ['chaminé pequena', 'antena parabólica'],
      condition: 'bom',
      solarPotential: 'excelente',
      recommendations: [
        'Orientação sul ideal para captação solar',
        'Inclinação adequada (20-30°)',
        'Área suficiente para sistema de médio porte',
        'Remover obstruções menores antes da instalação',
      ],
    };

    return {
      imageUrl,
      imageDescription,
      analysis: mockAnalysis,
      confidence: 0.89,
      processingTime: '2.3s',
    };
  },
};

// Tool para cálculo de economia energética
export const energySavingsTool: ToolDefinition = {
  name: 'calculate_energy_savings',
  description: 'Calcula economia financeira e ambiental com sistema solar',
  category: 'energy-calculation',
  capabilities: ['energy-calculation', 'financial-modeling'],
  parameters: [
    {
      name: 'systemSize',
      type: 'number',
      description: 'Tamanho do sistema em kWp',
      required: true,
    },
    {
      name: 'location',
      type: 'string',
      description: 'Localização para cálculo de irradiação solar',
      required: true,
    },
    {
      name: 'electricityRate',
      type: 'number',
      description: 'Tarifa de energia elétrica (R$/kWh)',
      required: true,
    },
    {
      name: 'years',
      type: 'number',
      description: 'Período de análise em anos',
      required: false,
    },
  ],
  execute: async (params) => {
    const { systemSize, location, electricityRate, years = 25 } = params;

    // Fatores de cálculo
    const solarIrradiation = 5.2; // kWh/m²/dia
    const systemEfficiency = 0.85;
    const performanceRatio = 0.8;
    const degradationRate = 0.005; // 0.5% ao ano

    // Cálculo de produção anual
    const annualProduction = systemSize * solarIrradiation * 365 * systemEfficiency * performanceRatio;

    // Projeção de economia ao longo dos anos
    const savings: number[] = [];
    let cumulativeSavings = 0;

    for (let year = 1; year <= years; year++) {
      const yearProduction = annualProduction * Math.pow(1 - degradationRate, year - 1);
      const yearSavings = yearProduction * electricityRate;
      cumulativeSavings += yearSavings;
      savings.push(yearSavings);
    }

    // Cálculo ambiental
    const co2Factor = 0.5; // kg CO2 por kWh (média Brasil)
    const totalCo2Reduction = annualProduction * co2Factor * years;

    return {
      systemSize,
      location,
      calculations: {
        annualProduction: Math.round(annualProduction),
        totalSavings: Math.round(cumulativeSavings),
        averageYearlySavings: Math.round(cumulativeSavings / years),
        co2Reduction: Math.round(totalCo2Reduction),
        paybackPeriod: 8.5, // anos (simulado)
      },
      projections: savings.map((saving, index) => ({
        year: index + 1,
        savings: Math.round(saving),
        cumulativeSavings: Math.round(savings.slice(0, index + 1).reduce((sum, s) => sum + s, 0)),
      })),
    };
  },
};

// Tool para busca de dados financeiros
export const financialDataTool: ToolDefinition = {
  name: 'get_financial_data',
  description: 'Busca dados financeiros atualizados para análise de investimentos solares',
  category: 'financial-modeling',
  capabilities: ['financial-modeling', 'real-time'],
  parameters: [
    {
      name: 'dataType',
      type: 'string',
      description: 'Tipo de dado financeiro (tariffs, incentives, rates)',
      required: true,
      enum: ['tariffs', 'incentives', 'interest_rates', 'inflation'],
    },
    {
      name: 'location',
      type: 'string',
      description: 'Localização para dados específicos',
      required: false,
    },
  ],
  execute: async (params) => {
    const { dataType, location = 'Brasil' } = params;

    // Dados simulados (em produção, buscaria de APIs reais)
    const mockData = {
      tariffs: {
        averageRate: 0.85, // R$/kWh
        region: location,
        lastUpdate: new Date().toISOString(),
        sources: ['ANEEL', 'Distribuidoras locais'],
      },
      incentives: {
        federal: {
          name: 'Programa de Incentivo à Energia Solar',
          discount: 0.15, // 15%
          maxValue: 20000,
        },
        state: {
          name: 'Incentivo Estadual',
          discount: 0.10, // 10%
          conditions: 'Para sistemas até 10kWp',
        },
      },
      interest_rates: {
        personalLoan: 0.025, // 2.5% ao mês
        financing: 0.015, // 1.5% ao mês
        inflation: 0.045, // 4.5% ao ano
      },
    };

    return {
      dataType,
      location,
      data: mockData[dataType as keyof typeof mockData] || {},
      timestamp: new Date().toISOString(),
    };
  },
};

// Tool para processamento de documentos
export const documentProcessingTool: ToolDefinition = {
  name: 'process_document',
  description: 'Processa documentos para extrair informações relevantes para análise solar',
  category: 'file-processing',
  capabilities: ['entity-extraction', 'data-processing'],
  parameters: [
    {
      name: 'documentType',
      type: 'string',
      description: 'Tipo de documento (bill, contract, technical_spec)',
      required: true,
      enum: ['bill', 'contract', 'technical_spec', 'permit'],
    },
    {
      name: 'content',
      type: 'string',
      description: 'Conteúdo do documento ou caminho do arquivo',
      required: true,
    },
  ],
  execute: async (params) => {
    const { documentType, content } = params;

    // Simulação de processamento de documento
    const mockProcessing = {
      bill: {
        extracted: {
          consumption: 450, // kWh
          period: '2024-01',
          rate: 0.78,
          totalAmount: 351.00,
        },
        insights: [
          'Consumo médio para residência familiar',
          'Tarifa dentro da média regional',
          'Potencial para economia de 30-40% com solar',
        ],
      },
      contract: {
        extracted: {
          parties: ['Cliente', 'Instaladora XYZ'],
          value: 25000,
          duration: '10 anos',
          warranty: '10 anos',
        },
        insights: [
          'Contrato padrão do mercado',
          'Garantia adequada para equipamentos',
          'Valor compatível com sistema proposto',
        ],
      },
      technical_spec: {
        extracted: {
          systemSize: '5.5kWp',
          panelType: 'Monocristalino',
          inverter: 'SMA Sunny Boy 5.0',
          estimatedProduction: 8500, // kWh/ano
        },
        insights: [
          'Configuração técnica adequada',
          'Equipamentos de boa qualidade',
          'Produção estimada realista',
        ],
      },
    };

    return {
      documentType,
      processing: mockProcessing[documentType as keyof typeof mockProcessing] || {},
      confidence: 0.92,
      processingTime: '1.8s',
    };
  },
};

// Registro de todas as tools disponíveis
export const AVAILABLE_TOOLS: Record<string, ToolDefinition> = {
  analyze_solar_viability: solarViabilityTool,
  detect_roof_features: roofDetectionTool,
  calculate_energy_savings: energySavingsTool,
  get_financial_data: financialDataTool,
  process_document: documentProcessingTool,
};

// Função para obter tools por categoria
export function getToolsByCategory(category: ToolCategory): ToolDefinition[] {
  return Object.values(AVAILABLE_TOOLS).filter(tool => tool.category === category);
}

// Função para obter tools por capabilities necessárias
export function getToolsByCapabilities(requiredCapabilities: string[]): ToolDefinition[] {
  return Object.values(AVAILABLE_TOOLS).filter(tool =>
    requiredCapabilities.every(cap => tool.capabilities.includes(cap))
  );
}

// Função para executar uma tool por nome
export async function executeTool(
  toolName: string,
  parameters: Record<string, any>
): Promise<any> {
  const tool = AVAILABLE_TOOLS[toolName];
  if (!tool) {
    throw new Error(`Tool '${toolName}' not found`);
  }

  return await tool.execute(parameters);
}

// Função para validar parâmetros de uma tool
export function validateToolParameters(
  toolName: string,
  parameters: Record<string, any>
): { valid: boolean; errors: string[] } {
  const tool = AVAILABLE_TOOLS[toolName];
  if (!tool) {
    return { valid: false, errors: [`Tool '${toolName}' not found`] };
  }

  const errors: string[] = [];

  for (const param of tool.parameters) {
    const value = parameters[param.name];

    if (param.required && (value === undefined || value === null)) {
      errors.push(`Parameter '${param.name}' is required`);
    }

    if (value !== undefined && param.enum && !param.enum.includes(value)) {
      errors.push(`Parameter '${param.name}' must be one of: ${param.enum.join(', ')}`);
    }
  }

  return { valid: errors.length === 0, errors };
}