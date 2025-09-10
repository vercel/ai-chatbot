import type { AgentCapability, AgentExecutionContext, AgentMemory, AgentResponse, AgentState } from '../tools/types';

interface LeadData {
  name: string | null;
  contact: { phone: string | null; email: string | null };
  address: { raw: string | null; lat: number | null; lng: number | null };
  bill: { kwh_month: number | null; fileId: string | null };
  roof: { files: string[]; has_images: boolean };
}

/**
 * InvestigationAgent coleta dados iniciais de leads
 * seguindo o fluxo do MEGA PROMPT #2.
 */
export class InvestigationAgent {
  private readonly capabilities: AgentCapability[] = [
    {
      name: 'lead_investigation',
      description: 'Coleta dados básicos do lead',
      tools: ['geocode_address', 'parse_bill_pdf', 'sql_upsert'],
      triggers: ['endereço', 'conta', 'telhado', 'foto', 'kwh', 'lead'],
      priority: 5,
      contextWindow: 2000,
      maxIterations: 4,
    },
  ];

  private memory: AgentMemory[] = [];
  private lead: LeadData = {
    name: null,
    contact: { phone: null, email: null },
    address: { raw: null, lat: null, lng: null },
    bill: { kwh_month: null, fileId: null },
    roof: { files: [], has_images: false },
  };

  private readonly state: AgentState = {
    id: 'investigation-agent',
    name: 'Investigation Agent',
    capabilities: this.capabilities,
    activeTools: ['geocode_address', 'parse_bill_pdf', 'sql_upsert'],
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
      this.parseLeadInfo(userInput);

      const actions = this.buildActions();
      const reply = this.buildReply();

      const responseData = {
        stage: 'investigation',
        lead: this.lead,
        actions,
        reply,
        assumptions: this.buildAssumptions(),
      };

      this.updateMemory('conversation', { input: userInput, response: responseData }, ['investigation']);

      this.state.status = 'idle';
      return {
        agentId: this.state.id,
        response: { type: 'investigation', data: responseData },
        confidence: 0.9,
        executionTime: Date.now() - startTime,
      };
    } catch (error) {
      this.state.status = 'error';
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.updateMemory('error', { error: errorMessage, context }, ['error', 'investigation']);
      return {
        agentId: this.state.id,
        response: { type: 'text', content: 'Erro na investigação do lead.' },
        confidence: 0.1,
        executionTime: Date.now() - startTime,
      };
    }
  }

  private extractUserInput(context: AgentExecutionContext): string {
    const lastMessage = context.conversationHistory[context.conversationHistory.length - 1];
    return lastMessage?.content || '';
  }

  private parseLeadInfo(input: string): void {
    const lower = input.toLowerCase();

    // Nome
    const nomeMatch = input.match(/meu nome é ([^.,\n]+)/i);
    if (nomeMatch) this.lead.name = nomeMatch[1].trim();

    // Telefone
    const phoneMatch = input.match(/\b\(?\d{2}\)?\s?\d{4,5}-?\d{4}\b/);
    if (phoneMatch) this.lead.contact.phone = phoneMatch[0];

    // Email
    const emailMatch = input.match(/[\w.+-]+@[\w.-]+\.[\w.-]+/);
    if (emailMatch) this.lead.contact.email = emailMatch[0];

    // Endereço
    if (!this.lead.address.raw) {
      const addressMatch = input.match(/(rua|avenida|av\.|rodovia|estrada)[^\n]+/i);
      if (addressMatch) this.lead.address.raw = addressMatch[0].trim();
    }

    // Consumo kWh
    const kwhMatch = lower.match(/(\d+)[\s-]*kwh/);
    if (kwhMatch) this.lead.bill.kwh_month = parseInt(kwhMatch[1], 10);

    // Fotos do telhado
    if (lower.includes('foto') || lower.includes('imagem')) {
      this.lead.roof.has_images = true;
    }
  }

  private buildActions() {
    const actions: any[] = [];
    if (this.lead.address.raw) {
      actions.push({
        tool: 'geocode_address',
        args: { address: this.lead.address.raw },
        why: 'viabilidade inicial',
      });
    }
    if (this.lead.bill.fileId) {
      actions.push({
        tool: 'parse_bill_pdf',
        args: { fileId: this.lead.bill.fileId },
        why: 'consumo médio',
      });
    }
    actions.push({
      tool: 'sql_upsert',
      args: {
        table: 'leads',
        row: {
          name: this.lead.name,
          address: this.lead.address.raw,
        },
      },
      why: 'persistir lead',
    });
    return actions;
  }

  private buildReply(): string {
    if (!this.lead.address.raw) {
      return 'Para avançar, preciso do endereço completo, da conta de luz e de fotos do telhado.';
    }
    if (!this.lead.bill.fileId) {
      return 'Endereço recebido. Agora preciso da conta de luz para analisar o consumo.';
    }
    if (!this.lead.roof.has_images) {
      return 'Conta recebida. Poderia enviar fotos do telhado?';
    }
    return 'Dados coletados com sucesso. Obrigado!';
  }

  private buildAssumptions(): string[] {
    const assumptions = [] as string[];
    if (!this.lead.address.raw) assumptions.push('Endereço ainda não fornecido');
    if (!this.lead.bill.fileId) assumptions.push('Conta de luz ainda não fornecida');
    if (!this.lead.roof.has_images) assumptions.push('Fotos do telhado ainda não fornecidas');
    return assumptions;
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
    if (this.memory.length > 50) this.memory = this.memory.slice(-50);
    this.state.memory = this.memory;
  }

  getState(): AgentState {
    return { ...this.state };
  }

  getCapabilities(): AgentCapability[] {
    return [...this.capabilities];
  }
}

export const investigationAgent = new InvestigationAgent();
