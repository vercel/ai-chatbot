/**
 * Sistema de Capabilities para LLMs Providers
 * Define as capacidades específicas de cada provider de IA
 */

export type CapabilityType =
  | 'text-generation'
  | 'code-generation'
  | 'image-generation'
  | 'image-analysis'
  | 'speech-to-text'
  | 'text-to-speech'
  | 'translation'
  | 'summarization'
  | 'sentiment-analysis'
  | 'entity-extraction'
  | 'question-answering'
  | 'conversation'
  | 'reasoning'
  | 'tool-calling'
  | 'function-calling'
  | 'multimodal'
  | 'streaming'
  | 'context-window'
  | 'fine-tuning'
  | 'batch-processing'
  | 'real-time'
  | 'offline-capable'
  | 'privacy-focused'
  | 'cost-effective'
  | 'solar-analysis'
  | 'financial-modeling'
  | 'technical-specs'
  | 'roof-detection'
  | 'energy-calculation';

export interface Capability {
  type: CapabilityType;
  name: string;
  description: string;
  score: number; // 0-100, quanto maior melhor
  metadata?: Record<string, any>;
}

export interface ProviderCapabilities {
  provider: string;
  model: string;
  capabilities: Capability[];
  overallScore: number;
  costPerToken: number;
  contextWindow: number;
  maxTokens: number;
  supportsStreaming: boolean;
  supportsTools: boolean;
  supportsVision: boolean;
  lastUpdated: Date;
}

export interface TaskRequirements {
  requiredCapabilities: CapabilityType[];
  preferredCapabilities?: CapabilityType[];
  minScore?: number;
  maxCost?: number;
  requiresStreaming?: boolean;
  requiresVision?: boolean;
  requiresTools?: boolean;
  contextLength?: number;
  priority?: 'cost' | 'speed' | 'quality' | 'reliability';
}

// Capabilities específicas do YSH (Yellow Solar Hub)
export const YSH_CAPABILITIES: Record<string, Capability[]> = {
  // OpenAI GPT-4
  'gpt-4': [
    {
      type: 'text-generation',
      name: 'Geração de Texto',
      description: 'Excelente para geração de texto criativo e técnico',
      score: 95,
    },
    {
      type: 'code-generation',
      name: 'Geração de Código',
      description: 'Especializado em geração e análise de código',
      score: 90,
    },
    {
      type: 'reasoning',
      name: 'Raciocínio Complexo',
      description: 'Capaz de raciocínio lógico avançado',
      score: 92,
    },
    {
      type: 'tool-calling',
      name: 'Chamada de Ferramentas',
      description: 'Suporte nativo para function calling',
      score: 95,
    },
    {
      type: 'conversation',
      name: 'Conversação Natural',
      description: 'Excelente para diálogos naturais',
      score: 93,
    },
    {
      type: 'solar-analysis',
      name: 'Análise Solar',
      description: 'Especializado em análise de viabilidade solar',
      score: 88,
    },
    {
      type: 'financial-modeling',
      name: 'Modelagem Financeira',
      description: 'Análise de custos e benefícios solares',
      score: 85,
    },
  ],

  // OpenAI GPT-4 Vision
  'gpt-4-vision-preview': [
    {
      type: 'multimodal',
      name: 'Multimodal',
      description: 'Processamento de texto e imagem simultaneamente',
      score: 90,
    },
    {
      type: 'image-analysis',
      name: 'Análise de Imagens',
      description: 'Análise detalhada de imagens de telhados',
      score: 88,
    },
    {
      type: 'roof-detection',
      name: 'Detecção de Telhados',
      description: 'Identificação automática de telhados em imagens',
      score: 85,
    },
    {
      type: 'text-generation',
      name: 'Geração de Texto',
      description: 'Geração de texto baseada em contexto visual',
      score: 90,
    },
  ],

  // Anthropic Claude
  'claude-3-opus': [
    {
      type: 'reasoning',
      name: 'Raciocínio Avançado',
      description: 'Especializado em raciocínio ético e analítico',
      score: 96,
    },
    {
      type: 'text-generation',
      name: 'Geração de Texto',
      description: 'Excelente qualidade de texto e criatividade',
      score: 94,
    },
    {
      type: 'conversation',
      name: 'Conversação Ética',
      description: 'Foco em respostas éticas e responsáveis',
      score: 95,
    },
    {
      type: 'tool-calling',
      name: 'Function Calling',
      description: 'Suporte robusto para ferramentas externas',
      score: 90,
    },
    {
      type: 'solar-analysis',
      name: 'Análise Solar Detalhada',
      description: 'Análise técnica aprofundada de sistemas solares',
      score: 92,
    },
    {
      type: 'financial-modeling',
      name: 'Modelagem Financeira',
      description: 'Análise financeira precisa e detalhada',
      score: 90,
    },
  ],

  // xAI Grok
  'grok-1': [
    {
      type: 'reasoning',
      name: 'Raciocínio Criativo',
      description: 'Abordagem única e criativa para problemas',
      score: 88,
    },
    {
      type: 'text-generation',
      name: 'Geração Inovadora',
      description: 'Texto criativo e não convencional',
      score: 87,
    },
    {
      type: 'real-time',
      name: 'Dados em Tempo Real',
      description: 'Acesso a informações atualizadas',
      score: 92,
    },
    {
      type: 'conversation',
      name: 'Conversação Divertida',
      description: 'Estilo conversacional único e envolvente',
      score: 89,
    },
    {
      type: 'solar-analysis',
      name: 'Análise Solar Inovadora',
      description: 'Perspectivas únicas sobre energia solar',
      score: 85,
    },
  ],

  // Google Gemini
  'gemini-pro': [
    {
      type: 'multimodal',
      name: 'Multimodal Avançado',
      description: 'Integração perfeita de texto, imagem e dados',
      score: 92,
    },
    {
      type: 'image-analysis',
      name: 'Análise Visual',
      description: 'Análise avançada de imagens e vídeos',
      score: 90,
    },
    {
      type: 'code-generation',
      name: 'Geração de Código',
      description: 'Especializado em múltiplas linguagens',
      score: 88,
    },
    {
      type: 'translation',
      name: 'Tradução',
      description: 'Suporte multilíngue avançado',
      score: 94,
    },
    {
      type: 'roof-detection',
      name: 'Detecção de Estruturas',
      description: 'Identificação precisa de telhados e estruturas',
      score: 89,
    },
    {
      type: 'energy-calculation',
      name: 'Cálculos Energéticos',
      description: 'Cálculos precisos de produção energética',
      score: 87,
    },
  ],

  // Ollama (Local)
  'llama3.2-vision': [
    {
      type: 'offline-capable',
      name: 'Funcionamento Offline',
      description: 'Funciona sem conexão com internet',
      score: 100,
    },
    {
      type: 'multimodal',
      name: 'Visão Local',
      description: 'Processamento de imagens localmente',
      score: 85,
    },
    {
      type: 'privacy-focused',
      name: 'Privacidade Total',
      description: 'Dados permanecem no dispositivo local',
      score: 100,
    },
    {
      type: 'cost-effective',
      name: 'Custo Zero',
      description: 'Não há custos de API após setup inicial',
      score: 100,
    },
    {
      type: 'roof-detection',
      name: 'Análise Local',
      description: 'Detecção de telhados sem upload de dados',
      score: 82,
    },
  ],
};

// Função para obter capabilities de um provider específico
export function getProviderCapabilities(
  provider: string,
  model: string
): ProviderCapabilities | null {
  const capabilities = YSH_CAPABILITIES[model];
  if (!capabilities) return null;

  // Calcular score geral baseado nas capabilities
  const overallScore = capabilities.reduce((sum, cap) => sum + cap.score, 0) / capabilities.length;

  // Metadados específicos por provider
  const providerMetadata = {
    'gpt-4': {
      costPerToken: 0.03,
      contextWindow: 8192,
      maxTokens: 4096,
      supportsStreaming: true,
      supportsTools: true,
      supportsVision: false,
    },
    'gpt-4-vision-preview': {
      costPerToken: 0.06,
      contextWindow: 8192,
      maxTokens: 4096,
      supportsStreaming: true,
      supportsTools: true,
      supportsVision: true,
    },
    'claude-3-opus': {
      costPerToken: 0.015,
      contextWindow: 200000,
      maxTokens: 4096,
      supportsStreaming: true,
      supportsTools: true,
      supportsVision: false,
    },
    'grok-1': {
      costPerToken: 0.01,
      contextWindow: 128000,
      maxTokens: 4096,
      supportsStreaming: true,
      supportsTools: false,
      supportsVision: false,
    },
    'gemini-pro': {
      costPerToken: 0.001,
      contextWindow: 32768,
      maxTokens: 2048,
      supportsStreaming: true,
      supportsTools: true,
      supportsVision: true,
    },
    'llama3.2-vision': {
      costPerToken: 0,
      contextWindow: 32768,
      maxTokens: 2048,
      supportsStreaming: false,
      supportsTools: false,
      supportsVision: true,
    },
  };

  const metadata = providerMetadata[model as keyof typeof providerMetadata];
  if (!metadata) return null;

  return {
    provider,
    model,
    capabilities,
    overallScore,
    ...metadata,
    lastUpdated: new Date(),
  };
}

// Função para encontrar o melhor provider para uma tarefa específica
export function findBestProviderForTask(
  requirements: TaskRequirements,
  availableProviders: ProviderCapabilities[]
): ProviderCapabilities | null {
  let bestProvider: ProviderCapabilities | null = null;
  let bestScore = -1;

  for (const provider of availableProviders) {
    const score = calculateProviderScore(provider, requirements);

    if (score > bestScore && meetsAllRequirements(provider, requirements)) {
      bestScore = score;
      bestProvider = provider;
    }
  }

  return bestProvider;
}

// Função auxiliar para calcular score do provider
function calculateProviderScore(
  provider: ProviderCapabilities,
  requirements: TaskRequirements
): number {
  let score = 0;

  // Verificar capabilities obrigatórias
  for (const requiredCap of requirements.requiredCapabilities) {
    const capability = provider.capabilities.find(cap => cap.type === requiredCap);
    if (capability) {
      score += capability.score;
    }
  }

  // Verificar capabilities preferenciais (bonus)
  if (requirements.preferredCapabilities) {
    for (const preferredCap of requirements.preferredCapabilities) {
      const capability = provider.capabilities.find(cap => cap.type === preferredCap);
      if (capability) {
        score += capability.score * 0.5; // 50% do peso das preferenciais
      }
    }
  }

  // Aplicar pesos baseados na prioridade
  score += calculatePriorityBonus(provider, requirements.priority);

  return score;
}

// Função auxiliar para calcular bônus de prioridade
function calculatePriorityBonus(
  provider: ProviderCapabilities,
  priority?: string
): number {
  switch (priority) {
    case 'cost':
      return (1 - provider.costPerToken / 0.1) * 20;
    case 'speed':
      return provider.supportsStreaming ? 15 : 0;
    case 'quality':
      return provider.overallScore * 0.2;
    case 'reliability':
      return provider.capabilities.length * 2;
    default:
      return 0;
  }
}

// Função auxiliar para verificar se provider atende todos os requisitos
function meetsAllRequirements(
  provider: ProviderCapabilities,
  requirements: TaskRequirements
): boolean {
  // Verificações específicas
  if (requirements.requiresStreaming && !provider.supportsStreaming) return false;
  if (requirements.requiresVision && !provider.supportsVision) return false;
  if (requirements.requiresTools && !provider.supportsTools) return false;
  if (requirements.maxCost && provider.costPerToken > requirements.maxCost) return false;
  if (requirements.minScore && provider.overallScore < requirements.minScore) return false;
  if (requirements.contextLength && provider.contextWindow < requirements.contextLength) return false;

  // Verificar se tem todas as capabilities obrigatórias
  return requirements.requiredCapabilities.every(requiredCap =>
    provider.capabilities.some(cap => cap.type === requiredCap)
  );
}

// Função para obter todos os providers disponíveis
export function getAllAvailableProviders(): ProviderCapabilities[] {
  const providers: ProviderCapabilities[] = [];

  Object.entries(YSH_CAPABILITIES).forEach(([model, capabilities]) => {
    const provider = getProviderNameFromModel(model);
    const providerCapabilities = getProviderCapabilities(provider, model);

    if (providerCapabilities) {
      providers.push(providerCapabilities);
    }
  });

  return providers;
}

// Função auxiliar para obter nome do provider a partir do modelo
function getProviderNameFromModel(model: string): string {
  if (model.includes('gpt')) return 'openai';
  if (model.includes('claude')) return 'anthropic';
  if (model.includes('grok')) return 'xai';
  if (model.includes('gemini')) return 'google';
  if (model.includes('llama')) return 'ollama';

  return 'unknown';
}