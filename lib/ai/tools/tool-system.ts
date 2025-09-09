

import type { ToolExecutionResult, ToolExecutionContext, ToolDefinition, ToolCall, } from './types';

// Cache para resultados de tools
class ToolCache {
  private readonly cache = new Map<string, { result: ToolExecutionResult; expires: number }>();
  private readonly defaultTTL = 300000; // 5 minutos

  generateKey(toolName: string, params: Record<string, any>): string {
    return `${toolName}:${JSON.stringify(params)}`;
  }

  get(key: string): ToolExecutionResult | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expires) {
      this.cache.delete(key);
      return null;
    }

    return entry.result;
  }

  set(key: string, result: ToolExecutionResult, ttl?: number): void {
    const expires = Date.now() + (ttl || this.defaultTTL);
    this.cache.set(key, { result, expires });
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

// Registry de tools
export class ToolRegistry {
  private readonly tools = new Map<string, ToolDefinition>();
  private readonly executors = new Map<string, (params: any, context: ToolExecutionContext) => Promise<any>>();
  private readonly cache = new ToolCache();

  register(
    definition: ToolDefinition,
    executor: (params: any, context: ToolExecutionContext) => Promise<any>
  ): void {
    this.tools.set(definition.name, definition);
    this.executors.set(definition.name, executor);
  }

  getDefinition(name: string): ToolDefinition | undefined {
    return this.tools.get(name);
  }

  getAllDefinitions(): ToolDefinition[] {
    return Array.from(this.tools.values());
  }

  getDefinitionsByCategory(category: ToolDefinition['category']): ToolDefinition[] {
    return this.getAllDefinitions().filter(tool => tool.category === category);
  }

  async executeTool(
    toolCall: Omit<ToolCall, 'result' | 'timestamp'>,
    context: ToolExecutionContext
  ): Promise<ToolExecutionResult> {
    const startTime = Date.now();
    const definition = this.tools.get(toolCall.toolName);

    if (!definition) {
      return {
        success: false,
        error: `Tool '${toolCall.toolName}' not found`,
        executionTime: Date.now() - startTime,
      };
    }

    const executor = this.executors.get(toolCall.toolName);
    if (!executor) {
      return {
        success: false,
        error: `Executor for tool '${toolCall.toolName}' not found`,
        executionTime: Date.now() - startTime,
      };
    }

    // Verificar cache se a tool for cacheable
    if (definition.cacheable) {
      const cacheKey = this.cache.generateKey(toolCall.toolName, toolCall.parameters);
      const cachedResult = this.cache.get(cacheKey);
      if (cachedResult) {
        return {
          ...cachedResult,
          cached: true,
          executionTime: Date.now() - startTime,
        };
      }
    }

    try {
      // Executar a tool com timeout
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Tool execution timeout')), definition.timeout || 30000);
      });

      const executionPromise = executor(toolCall.parameters, context);
      const result = await Promise.race([executionPromise, timeoutPromise]);

      const executionResult: ToolExecutionResult = {
        success: true,
        data: result,
        executionTime: Date.now() - startTime,
        cost: definition.costEstimate,
      };

      // Cachear resultado se aplicável
      if (definition.cacheable) {
        const cacheKey = this.cache.generateKey(toolCall.toolName, toolCall.parameters);
        this.cache.set(cacheKey, executionResult);
      }

      return executionResult;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown execution error',
        executionTime: Date.now() - startTime,
      };
    }
  }

  getCacheStats(): { size: number; hitRate?: number } {
    return {
      size: this.cache.size(),
    };
  }

  clearCache(): void {
    this.cache.clear();
  }
}

// Sistema principal de tools
export class LLMToolSystem {
  private readonly registry = new ToolRegistry();
  private readonly activeCalls = new Map<string, ToolCall>();

  constructor() {
    this.initializeBuiltInTools();
  }

  private initializeBuiltInTools(): void {
    // Tool de cálculo solar
    this.registry.register(
      {
        name: 'solar_calculator',
        description: 'Calculate solar panel system savings and ROI',
        parameters: {
          location: {
            name: 'location',
            type: 'string',
            description: 'Location for solar irradiance calculation',
            required: true,
          },
          monthlyBill: {
            name: 'monthlyBill',
            type: 'number',
            description: 'Current monthly electricity bill in USD',
            required: true,
          },
          roofArea: {
            name: 'roofArea',
            type: 'number',
            description: 'Available roof area in square meters',
            required: true,
          },
          panelEfficiency: {
            name: 'panelEfficiency',
            type: 'number',
            description: 'Solar panel efficiency (0-1)',
            default: 0.22,
          },
        },
        category: 'calculation',
        version: '1.0.0',
        cacheable: true,
        costEstimate: 0.001,
      },
      this.executeSolarCalculator.bind(this)
    );

    // Tool de análise de leads
    this.registry.register(
      {
        name: 'lead_analyzer',
        description: 'Analyze and qualify leads for solar installation',
        parameters: {
          leadData: {
            name: 'leadData',
            type: 'object',
            description: 'Lead information including contact, property, and preferences',
            required: true,
          },
          criteria: {
            name: 'criteria',
            type: 'object',
            description: 'Qualification criteria and scoring weights',
            required: false,
          },
        },
        category: 'analysis',
        version: '1.0.0',
        cacheable: false,
        costEstimate: 0.002,
      },
      this.executeLeadAnalyzer.bind(this)
    );

    // Tool de comunicação
    this.registry.register(
      {
        name: 'communication_tool',
        description: 'Send emails, SMS, or notifications to leads',
        parameters: {
          type: {
            name: 'type',
            type: 'string',
            description: 'Communication type: email, sms, push',
            required: true,
            enum: ['email', 'sms', 'push'],
          },
          recipient: {
            name: 'recipient',
            type: 'string',
            description: 'Recipient contact information',
            required: true,
          },
          message: {
            name: 'message',
            type: 'string',
            description: 'Message content',
            required: true,
          },
          template: {
            name: 'template',
            type: 'string',
            description: 'Template to use for the message',
            required: false,
          },
        },
        category: 'communication',
        version: '1.0.0',
        cacheable: false,
        costEstimate: 0.001,
      },
      this.executeCommunicationTool.bind(this)
    );
  }

  private async executeSolarCalculator(params: any, context: ToolExecutionContext): Promise<any> {
    // Simulação de cálculo solar
    const { location, monthlyBill, roofArea, panelEfficiency = 0.22 } = params;

    // Cálculos simplificados (em produção, usar APIs reais)
    const avgIrradiance = 5.5; // kWh/m²/day (média brasileira)
    const dailyGeneration = roofArea * avgIrradiance * panelEfficiency;
    const monthlyGeneration = dailyGeneration * 30;
    const systemSize = Math.min(roofArea * 0.8, monthlyBill / 100); // Estimativa básica

    const annualSavings = monthlyBill * 12 * 0.7; // 70% economia estimada
    const paybackYears = (systemSize * 1500) / annualSavings; // $1.50/W custo estimado

    return {
      systemSize: Math.round(systemSize * 100) / 100,
      monthlyGeneration: Math.round(monthlyGeneration * 100) / 100,
      annualSavings: Math.round(annualSavings * 100) / 100,
      paybackYears: Math.round(paybackYears * 100) / 100,
      roi: Math.round((annualSavings / (systemSize * 1500)) * 10000) / 100,
      location,
      assumptions: {
        irradiance: avgIrradiance,
        efficiency: panelEfficiency,
        costPerWatt: 1.50,
        savingsRate: 0.7,
      },
    };
  }

  private async executeLeadAnalyzer(params: any, context: ToolExecutionContext): Promise<any> {
    const { leadData, criteria = {} } = params;

    // Sistema de pontuação de leads
    let score = 0;
    const factors = [];

    // Análise de localização
    if (leadData.location?.irradiance > 4.5) {
      score += 20;
      factors.push({ factor: 'high_irradiance', score: 20 });
    }

    // Análise de consumo
    if (leadData.monthlyBill > 200) {
      score += 25;
      factors.push({ factor: 'high_consumption', score: 25 });
    }

    // Análise de propriedade
    if (leadData.roofArea > 50) {
      score += 20;
      factors.push({ factor: 'large_roof', score: 20 });
    }

    // Análise de urgência
    if (leadData.urgency === 'high') {
      score += 15;
      factors.push({ factor: 'high_urgency', score: 15 });
    }

    // Análise de orçamento
    if (leadData.budget > 10000) {
      score += 20;
      factors.push({ factor: 'good_budget', score: 20 });
    }

    let qualification: string;
    if (score >= 80) {
      qualification = 'hot';
    } else if (score >= 60) {
      qualification = 'warm';
    } else {
      qualification = 'cold';
    }

    return {
      leadId: leadData.id,
      score,
      qualification,
      factors,
      recommendations: this.generateLeadRecommendations(qualification, leadData),
      nextSteps: this.generateNextSteps(qualification),
    };
  }

  private generateLeadRecommendations(qualification: string, leadData: any): string[] {
    const recommendations = [];

    switch (qualification) {
      case 'hot':
        recommendations.push('Agendar visita técnica imediata');
        recommendations.push('Preparar proposta personalizada');
        recommendations.push('Enviar materiais de marketing premium');
        break;
      case 'warm':
        recommendations.push('Enviar calculadora solar interativa');
        recommendations.push('Agendar consulta por telefone');
        recommendations.push('Enviar estudos de caso similares');
        break;
      case 'cold':
        recommendations.push('Adicionar à lista de nurturing');
        recommendations.push('Enviar conteúdo educativo mensal');
        recommendations.push('Monitorar sinais de interesse');
        break;
    }

    return recommendations;
  }

  private generateNextSteps(qualification: string): string[] {
    const steps = [];

    switch (qualification) {
      case 'hot':
        steps.push('1. Contato imediato (24h)');
        steps.push('2. Agendamento de visita (48h)');
        steps.push('3. Preparação de proposta (1 semana)');
        break;
      case 'warm':
        steps.push('1. Envio de materiais (48h)');
        steps.push('2. Follow-up por email (1 semana)');
        steps.push('3. Agendamento de consulta (2 semanas)');
        break;
      case 'cold':
        steps.push('1. Adição ao drip campaign');
        steps.push('2. Monitoramento de engajamento');
        steps.push('3. Reativação em 3 meses');
        break;
    }

    return steps;
  }

  private async executeCommunicationTool(params: any, context: ToolExecutionContext): Promise<any> {
    const { type, recipient, message } = params;

    // Simulação de envio de comunicação
    const messageId = `msg_${Date.now()}_${crypto.randomUUID()}`;

    // Em produção, integrar com serviços reais (SendGrid, Twilio, etc.)
    console.log(`[${type.toUpperCase()}] Sending message to ${recipient}: ${message}`);

    let cost: number;
    if (type === 'sms') {
      cost = 0.01;
    } else if (type === 'email') {
      cost = 0.0001;
    } else {
      cost = 0;
    }

    return {
      messageId,
      type,
      recipient,
      status: 'sent',
      timestamp: new Date().toISOString(),
      cost,
    };
  }

  // API pública
  getRegistry(): ToolRegistry {
    return this.registry;
  }

  async executeToolCall(
    toolCall: Omit<ToolCall, 'result' | 'timestamp'>,
    context: ToolExecutionContext
  ): Promise<ToolExecutionResult> {
    return this.registry.executeTool(toolCall, context);
  }

  getAvailableTools(): ToolDefinition[] {
    return this.registry.getAllDefinitions();
  }

  getToolsByCategory(category: ToolDefinition['category']): ToolDefinition[] {
    return this.registry.getDefinitionsByCategory(category);
  }

  getCacheStats() {
    return this.registry.getCacheStats();
  }

  clearCache(): void {
    this.registry.clearCache();
  }
}

// Instância global do sistema de tools
export const toolSystem = new LLMToolSystem();