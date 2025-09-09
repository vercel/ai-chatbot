/**
 * Sistema de Agentes Especializados
 * Agentes inteligentes para diferentes domínios da aplicação YSH
 */

import type {
  AgentCapability,
  AgentState,
  AgentMemory,
  AgentExecutionContext,
  AgentResponse,
  OrchestrationRule,
  OrchestrationAction,
  OrchestrationContext,
  SystemHealth,
  HealthStatus
} from '../tools/types';
import { toolSystem } from '../tools/tool-system';
import { loadBalancingService } from '@/lib/services/load-balancing-service';

// Agente Calculadora Solar
export class SolarCalculatorAgent {
  private readonly capabilities: AgentCapability[] = [
    {
      name: 'solar_calculation',
      description: 'Calculate solar panel system savings and ROI',
      tools: ['solar_calculator'],
      triggers: ['solar', 'panel', 'energy', 'saving', 'cost', 'roi'],
      priority: 9,
      contextWindow: 4000,
      maxIterations: 3,
    },
    {
      name: 'technical_analysis',
      description: 'Analyze technical feasibility of solar installation',
      tools: ['solar_calculator'],
      triggers: ['roof', 'area', 'orientation', 'shading', 'technical'],
      priority: 8,
      contextWindow: 3000,
      maxIterations: 2,
    },
  ];

  private memory: AgentMemory[] = [];
  private readonly state: AgentState = {
    id: 'solar-calculator-agent',
    name: 'Solar Calculator Agent',
    capabilities: this.capabilities,
    activeTools: ['solar_calculator'],
    context: {},
    memory: this.memory,
    status: 'idle',
    lastActivity: new Date(),
  };

  async processRequest(context: AgentExecutionContext): Promise<AgentResponse> {
    const startTime = Date.now();
    this.state.status = 'active';
    this.state.lastActivity = new Date();

    try {
      // Analisar a entrada do usuário
      const userInput = this.extractUserInput(context);
      const intent = this.analyzeIntent(userInput);

      // Selecionar capability apropriada
      const capability = this.selectCapability(intent);
      if (!capability) {
        return this.createResponse('Não consegui identificar uma solicitação válida para cálculo solar.', 0.3, startTime);
      }

      // Executar tools necessárias
      const toolResults = await this.executeTools(capability, context);

      // Gerar resposta baseada nos resultados
      const response = await this.generateResponse(toolResults, context);

      // Atualizar memória
      this.updateMemory('conversation', { input: userInput, response, toolResults }, ['solar', 'calculation']);

      this.state.status = 'idle';
      return response;

    } catch (error) {
      this.state.status = 'error';
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.updateMemory('error', { error: errorMessage, context }, ['error', 'solar']);
      return this.createResponse('Desculpe, ocorreu um erro no processamento. Tente novamente.', 0.1, startTime);
    }
  }

  private extractUserInput(context: AgentExecutionContext): string {
    const lastMessage = context.conversationHistory[context.conversationHistory.length - 1];
    return lastMessage?.content || '';
  }

  private analyzeIntent(input: string): string[] {
    const intents: string[] = [];
    const lowerInput = input.toLowerCase();

    if (lowerInput.includes('solar') || lowerInput.includes('painel')) intents.push('solar');
    if (lowerInput.includes('custo') || lowerInput.includes('preço') || lowerInput.includes('valor')) intents.push('cost');
    if (lowerInput.includes('poupança') || lowerInput.includes('economia')) intents.push('saving');
    if (lowerInput.includes('retorno') || lowerInput.includes('roi')) intents.push('roi');
    if (lowerInput.includes('telhado') || lowerInput.includes('roof')) intents.push('roof');
    if (lowerInput.includes('técnico') || lowerInput.includes('technical')) intents.push('technical');

    return intents;
  }

  private selectCapability(intents: string[]): AgentCapability | null {
    for (const intent of intents) {
      for (const capability of this.capabilities) {
        if (capability.triggers.includes(intent)) {
          return capability;
        }
      }
    }
    return null;
  }

  private async executeTools(capability: AgentCapability, context: AgentExecutionContext): Promise<any[]> {
    const results: any[] = [];

    for (const toolName of capability.tools) {
      try {
        const providerResult = await loadBalancingService.selectProvider({ modelType: 'chat' });
        const provider = providerResult.success && providerResult.data ? providerResult.data : {
          provider: 'ollama',
          model: 'qwen3:30b',
          reason: 'Fallback',
          score: 0,
          alternatives: [],
        };

        const toolCall = {
          id: `call_${Date.now()}_${Math.random()}`,
          toolName,
          parameters: this.extractToolParameters(context, toolName),
          context: {
            provider,
            model: 'gpt-4',
            temperature: 0.7,
            userId: context.userId,
            sessionId: context.sessionId,
          },
          timestamp: new Date(),
        };

        const result = await toolSystem.executeToolCall(toolCall, toolCall.context);
        results.push(result);
      } catch (error) {
        console.error(`Error executing tool ${toolName}:`, error);
      }
    }

    return results;
  }

  private extractToolParameters(context: AgentExecutionContext, toolName: string): Record<string, any> {
    const userInput = this.extractUserInput(context);

    // Extração simples de parâmetros (em produção, usar NLP mais sofisticado)
    const params: Record<string, any> = {};

    // Extrair localização
    if (userInput.includes('São Paulo') || userInput.includes('SP')) {
      params.location = 'São Paulo, SP';
    } else if (userInput.includes('Rio de Janeiro') || userInput.includes('RJ')) {
      params.location = 'Rio de Janeiro, RJ';
    } else {
      params.location = 'São Paulo, SP'; // Default
    }

    // Extrair conta mensal
    const billRegex = /(\d+)[,.]?(\d*)\s*(?:reais?|R\$)/i;
    const billMatch = billRegex.exec(userInput);
    if (billMatch) {
      params.monthlyBill = Number.parseFloat(`${billMatch[1]}.${billMatch[2] || '00'}`);
    } else {
      params.monthlyBill = 300; // Default
    }

    // Extrair área do telhado
    const areaRegex = /(\d+)[,.]?(\d*)\s*(?:m²|m2|metros)/i;
    const areaMatch = areaRegex.exec(userInput);
    if (areaMatch) {
      params.roofArea = Number.parseFloat(`${areaMatch[1]}.${areaMatch[2] || '00'}`);
    } else {
      params.roofArea = 100; // Default
    }

    return params;
  }

  private async generateResponse(toolResults: any[], context: AgentExecutionContext): Promise<AgentResponse> {
    const startTime = Date.now();

    // Combinar resultados das tools
    const combinedData = this.combineToolResults(toolResults);

    // Gerar resposta natural baseada nos dados
    const response = this.formatSolarResponse(combinedData);

    return {
      agentId: this.state.id,
      response,
      toolCalls: [], // Já executadas
      nextActions: ['follow_up', 'schedule_consultation'],
      confidence: 0.85,
      executionTime: Date.now() - startTime,
      metadata: {
        toolResultsCount: toolResults.length,
        combinedData,
      },
    };
  }

  private combineToolResults(toolResults: any[]): any {
    // Combinar resultados de múltiplas tools
    const combined = {
      calculations: [] as any[],
      recommendations: [] as string[],
      warnings: [] as string[],
    };

    for (const result of toolResults) {
      if (result.success && result.data) {
        combined.calculations.push(result.data);

        // Gerar recomendações baseadas nos dados
        if (result.data.paybackYears < 5) {
          combined.recommendations.push('Excelente payback period!');
        } else if (result.data.paybackYears > 10) {
          combined.warnings.push('Payback period longo - considere otimizar o sistema');
        }
      }
    }

    return combined;
  }

  private formatSolarResponse(combinedData: any): any {
    const calc = combinedData.calculations[0];

    if (!calc) {
      return {
        type: 'text',
        content: 'Não foi possível calcular os dados solares. Por favor, forneça mais informações sobre sua conta de energia e área disponível.',
      };
    }

    return {
      type: 'solar_calculation',
      content: `Baseado nos dados fornecidos, aqui está a análise do seu sistema solar:

💰 **Economia Anual**: R$ ${calc.annualSavings?.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
⚡ **Geração Mensal**: ${calc.monthlyGeneration?.toFixed(1)} kWh
🏠 **Sistema Recomendado**: ${calc.systemSize?.toFixed(1)} kWp
⏰ **Payback**: ${calc.paybackYears?.toFixed(1)} anos
📈 **ROI**: ${calc.roi?.toFixed(1)}%

${combinedData.recommendations.map((rec: string) => `✅ ${rec}`).join('\n')}
${combinedData.warnings.map((warn: string) => `⚠️ ${warn}`).join('\n')}

Gostaria de agendar uma visita técnica para avaliação mais precisa?`,
      data: calc,
    };
  }

  private updateMemory(type: AgentMemory['type'], content: any, tags: string[]): void {
    const memory: AgentMemory = {
      id: `mem_${Date.now()}_${Math.random()}`,
      type,
      content,
      timestamp: new Date(),
      importance: type === 'error' ? 8 : 5,
      tags,
    };

    this.memory.push(memory);

    // Manter apenas as últimas 50 memórias
    if (this.memory.length > 50) {
      this.memory = this.memory.slice(-50);
    }

    this.state.memory = this.memory;
  }

  private createResponse(content: string, confidence: number, startTime: number): AgentResponse {
    return {
      agentId: this.state.id,
      response: { type: 'text', content },
      confidence,
      executionTime: Date.now() - startTime,
    };
  }

  getState(): AgentState {
    return { ...this.state };
  }

  getCapabilities(): AgentCapability[] {
    return [...this.capabilities];
  }
}

// Agente Qualificação de Leads
export class LeadQualificationAgent {
  private readonly capabilities: AgentCapability[] = [
    {
      name: 'lead_analysis',
      description: 'Analyze and qualify leads for solar installation',
      tools: ['lead_analyzer'],
      triggers: ['lead', 'prospect', 'customer', 'qualification', 'score'],
      priority: 9,
      contextWindow: 3000,
      maxIterations: 2,
    },
    {
      name: 'communication',
      description: 'Send personalized communications to leads',
      tools: ['communication_tool'],
      triggers: ['email', 'contact', 'message', 'follow-up'],
      priority: 7,
      contextWindow: 2000,
      maxIterations: 1,
    },
  ];

  private memory: AgentMemory[] = [];
  private readonly state: AgentState = {
    id: 'lead-qualification-agent',
    name: 'Lead Qualification Agent',
    capabilities: this.capabilities,
    activeTools: ['lead_analyzer', 'communication_tool'],
    context: {},
    memory: this.memory,
    status: 'idle',
    lastActivity: new Date(),
  };

  async processRequest(context: AgentExecutionContext): Promise<AgentResponse> {
    const startTime = Date.now();
    this.state.status = 'active';
    this.state.lastActivity = new Date();

    try {
      const userInput = this.extractUserInput(context);
      const intent = this.analyzeIntent(userInput);

      const capability = this.selectLeadCapability(intent);
      if (!capability) {
        return this.createResponse('Não identifiquei uma solicitação relacionada à qualificação de leads.', 0.3, startTime);
      }

      const toolResults = await this.executeTools(capability, context);
      const response = await this.generateLeadResponse(toolResults, context);

      this.updateLeadMemory('conversation', { input: userInput, response, toolResults }, ['lead', 'qualification']);

      this.state.status = 'idle';
      return response;

    } catch (error) {
      this.state.status = 'error';
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.updateLeadMemory('error', { error: errorMessage, context }, ['error', 'lead']);
      return this.createResponse('Erro no processamento da qualificação de lead.', 0.1, startTime);
    }
  }

  private extractUserInput(context: AgentExecutionContext): string {
    const lastMessage = context.conversationHistory[context.conversationHistory.length - 1];
    return lastMessage?.content || '';
  }

  private analyzeIntent(input: string): string[] {
    const intents: string[] = [];
    const lowerInput = input.toLowerCase();

    if (lowerInput.includes('lead') || lowerInput.includes('prospect')) intents.push('lead');
    if (lowerInput.includes('qualif') || lowerInput.includes('score')) intents.push('qualification');
    if (lowerInput.includes('email') || lowerInput.includes('contact')) intents.push('communication');

    return intents;
  }

  private selectLeadCapability(intents: string[]): AgentCapability | null {
    for (const intent of intents) {
      for (const capability of this.capabilities) {
        if (capability.triggers.includes(intent)) {
          return capability;
        }
      }
    }
    return null;
  }

  private async executeTools(capability: AgentCapability, context: AgentExecutionContext): Promise<any[]> {
    const results: any[] = [];

    for (const toolName of capability.tools) {
      try {
        const providerResult = await loadBalancingService.selectProvider({ modelType: 'chat' });
        const provider = providerResult.success && providerResult.data ? providerResult.data : {
          provider: 'ollama',
          model: 'qwen3:30b',
          reason: 'Fallback',
          score: 0,
          alternatives: [],
        };

        const toolCall = {
          id: `call_${Date.now()}_${Math.random()}`,
          toolName,
          parameters: this.extractLeadParameters(context, toolName),
          context: {
            provider,
            model: 'gpt-4',
            temperature: 0.7,
            userId: context.userId,
            sessionId: context.sessionId,
          },
          timestamp: new Date(),
        };

        const result = await toolSystem.executeToolCall(toolCall, toolCall.context);
        results.push(result);
      } catch (error) {
        console.error(`Error executing tool ${toolName}:`, error);
      }
    }

    return results;
  }

  private extractLeadParameters(context: AgentExecutionContext, toolName: string): Record<string, any> {
    if (toolName === 'lead_analyzer') {
      // Simular dados de lead extraídos da conversa
      return {
        leadData: {
          id: `lead_${Date.now()}`,
          name: 'João Silva',
          email: 'joao@email.com',
          phone: '+55 11 99999-9999',
          location: 'São Paulo, SP',
          monthlyBill: 450,
          roofArea: 120,
          urgency: 'medium',
          budget: 25000,
        },
        criteria: {
          minBill: 200,
          minArea: 50,
          maxPayback: 8,
        },
      };
    }

    if (toolName === 'communication_tool') {
      return {
        type: 'email',
        recipient: 'joao@email.com',
        message: 'Olá João, obrigado pelo interesse em energia solar!',
        template: 'lead_followup',
      };
    }

    return {};
  }

  private async generateLeadResponse(toolResults: any[], context: AgentExecutionContext): Promise<AgentResponse> {
    const startTime = Date.now();

    const combinedData = this.combineLeadResults(toolResults);
    const response = this.formatLeadResponse(combinedData);

    return {
      agentId: this.state.id,
      response,
      toolCalls: [],
      nextActions: ['schedule_followup', 'update_crm'],
      confidence: 0.9,
      executionTime: Date.now() - startTime,
      metadata: {
        leadScore: combinedData.score,
        qualification: combinedData.qualification,
      },
    };
  }

  private combineLeadResults(toolResults: any[]): any {
    const combined = {
      analyses: [] as any[],
      communications: [] as any[],
      score: 0,
      qualification: 'cold',
      recommendations: [] as string[],
      nextSteps: [] as string[],
    };

    for (const result of toolResults) {
      if (result.success && result.data) {
        if (result.data.score !== undefined) {
          combined.analyses.push(result.data);
          combined.score = Math.max(combined.score, result.data.score);
          combined.qualification = result.data.qualification;
          combined.recommendations = result.data.recommendations || [];
          combined.nextSteps = result.data.nextSteps || [];
        } else if (result.data.messageId) {
          combined.communications.push(result.data);
        }
      }
    }

    return combined;
  }

  private formatLeadResponse(combinedData: any): any {
    const analysis = combinedData.analyses[0];

    if (!analysis) {
      return {
        type: 'text',
        content: 'Não foi possível analisar os dados do lead. Verifique se todas as informações necessárias foram fornecidas.',
      };
    }

    return {
      type: 'lead_analysis',
      content: `📊 **Análise de Lead Completa**

**Pontuação**: ${combinedData.score}/100
**Qualificação**: ${combinedData.qualification.toUpperCase()}
**Fatores de Pontuação**:
${analysis.factors?.map((f: any) => `• ${f.factor}: +${f.score} pontos`).join('\n')}

**Recomendações**:
${combinedData.recommendations.map((rec: string) => `✅ ${rec}`).join('\n')}

**Próximos Passos**:
${combinedData.nextSteps.map((step: string) => `📝 ${step}`).join('\n')}

${combinedData.communications.length > 0 ? '📧 Comunicação enviada com sucesso!' : ''}`,
      data: combinedData,
    };
  }

  private updateLeadMemory(type: AgentMemory['type'], content: any, tags: string[]): void {
    const memory: AgentMemory = {
      id: `mem_${Date.now()}_${Math.random()}`,
      type,
      content,
      timestamp: new Date(),
      importance: type === 'error' ? 8 : 5,
      tags,
    };

    this.memory.push(memory);

    if (this.memory.length > 50) {
      this.memory = this.memory.slice(-50);
    }

    this.state.memory = this.memory;
  }

  private createResponse(content: string, confidence: number, startTime: number): AgentResponse {
    return {
      agentId: this.state.id,
      response: { type: 'text', content },
      confidence,
      executionTime: Date.now() - startTime,
    };
  }

  getState(): AgentState {
    return { ...this.state };
  }

  getCapabilities(): AgentCapability[] {
    return [...this.capabilities];
  }
}

// Sistema de Agentes Principal
export class AgentOrchestrator {
  private readonly agents = new Map<string, SolarCalculatorAgent | LeadQualificationAgent>();
  private readonly rules: OrchestrationRule[] = [];
  private readonly activeContexts = new Map<string, OrchestrationContext>();

  constructor() {
    this.initializeAgents();
    this.initializeRules();
  }

  private initializeAgents(): void {
    this.agents.set('solar-calculator', new SolarCalculatorAgent());
    this.agents.set('lead-qualifier', new LeadQualificationAgent());
  }

  private initializeRules(): void {
    // Regra para ativar agente solar
    this.rules.push({
      id: 'solar_calculation_trigger',
      name: 'Solar Calculation Trigger',
      condition: (context) => {
        const input = context.conversationHistory[context.conversationHistory.length - 1]?.content || '';
        return input.toLowerCase().includes('solar') || input.toLowerCase().includes('painel');
      },
      actions: [
        {
          type: 'activate_agent',
          target: 'solar-calculator',
        },
      ],
      priority: 9,
      enabled: true,
    });

    // Regra para ativar agente de leads
    this.rules.push({
      id: 'lead_qualification_trigger',
      name: 'Lead Qualification Trigger',
      condition: (context) => {
        const input = context.conversationHistory[context.conversationHistory.length - 1]?.content || '';
        return input.toLowerCase().includes('lead') || input.toLowerCase().includes('prospect');
      },
      actions: [
        {
          type: 'activate_agent',
          target: 'lead-qualifier',
        },
      ],
      priority: 8,
      enabled: true,
    });
  }

  async processRequest(context: AgentExecutionContext): Promise<AgentResponse> {
    // Verificar regras de orquestração
    const applicableRules = this.evaluateRules(context);

    if (applicableRules.length > 0) {
      // Executar ações das regras
      await this.executeRuleActions(applicableRules, context);

      // Selecionar agente apropriado
      const selectedAgent = this.selectAgent(context);

      if (selectedAgent) {
        return selectedAgent.processRequest(context);
      }
    }

    // Fallback para resposta genérica
    return {
      agentId: 'orchestrator',
      response: {
        type: 'text',
        content: 'Como posso ajudar com sua solicitação relacionada à energia solar?',
      },
      confidence: 0.5,
      executionTime: 0,
    };
  }

  private evaluateRules(context: AgentExecutionContext): OrchestrationRule[] {
    return this.rules
      .filter(rule => rule.enabled && rule.condition(context))
      .sort((a, b) => b.priority - a.priority);
  }

  private async executeRuleActions(rules: OrchestrationRule[], context: AgentExecutionContext): Promise<void> {
    for (const rule of rules) {
      for (const action of rule.actions) {
        await this.executeAction(action, context);
      }
    }
  }

  private async executeAction(action: OrchestrationAction, context: AgentExecutionContext): Promise<void> {
    if (action.type === 'activate_agent') {
      if (action.target) {
        // Ativar agente no contexto
        const orchContext: OrchestrationContext = {
          sessionId: context.sessionId,
          activeAgents: [action.target],
          currentPhase: 'active',
          rules: this.rules,
          state: {},
          lastUpdate: new Date(),
        };
        this.activeContexts.set(context.sessionId, orchContext);
      }
    }
    // Outros tipos de ação podem ser implementados aqui
  }

  private selectAgent(context: AgentExecutionContext): SolarCalculatorAgent | LeadQualificationAgent | null {
    const orchContext = this.activeContexts.get(context.sessionId);

    if (orchContext && orchContext.activeAgents.length > 0) {
      const agentId = orchContext.activeAgents[0];
      return this.agents.get(agentId) || null;
    }

    // Seleção baseada no conteúdo da mensagem
    const input = context.conversationHistory[context.conversationHistory.length - 1]?.content || '';

    if (input.toLowerCase().includes('solar') || input.toLowerCase().includes('painel')) {
      return this.agents.get('solar-calculator') || null;
    }

    if (input.toLowerCase().includes('lead') || input.toLowerCase().includes('prospect')) {
      return this.agents.get('lead-qualifier') || null;
    }

    return null;
  }

  getAgent(agentId: string): SolarCalculatorAgent | LeadQualificationAgent | null {
    return this.agents.get(agentId) || null;
  }

  getAllAgents(): (SolarCalculatorAgent | LeadQualificationAgent)[] {
    return Array.from(this.agents.values());
  }

  getActiveContexts(): OrchestrationContext[] {
    return Array.from(this.activeContexts.values());
  }

  getSystemHealth(): SystemHealth {
    const agents: Record<string, HealthStatus> = {};
    const tools: Record<string, HealthStatus> = {};

    for (const [id, agent] of this.agents.entries()) {
      const status = agent.getState().status;
      if (status === 'error') {
        agents[id] = 'critical';
      } else if (status === 'active') {
        agents[id] = 'healthy';
      } else {
        agents[id] = 'degraded';
      }
    }

    for (const tool of toolSystem.getAvailableTools()) {
      tools[tool.name] = 'healthy';
    }

    return {
      overall: 'healthy',
      agents,
      tools,
      performance: {
        avgResponseTime: 1500, // Mock
        errorRate: 0.02,
        throughput: 100,
      },
      lastCheck: new Date(),
    };
  }
}

// Instância global do orquestrador
export const agentOrchestrator = new AgentOrchestrator();