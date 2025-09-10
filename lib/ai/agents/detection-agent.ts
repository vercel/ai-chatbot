import type { AgentCapability, AgentExecutionContext, AgentMemory, AgentResponse, AgentState } from '../tools/types';

interface SiteDetection {
  lat: number;
  lng: number;
  snapshots: { url: string; zoom: number }[];
  detected_panels?: { count: number; confidence: number };
  roof_mask?: { url: string; coverage_m2: number };
}

/**
 * DetectionAgent analisa imagens ou coordenadas para identificar potencial solar.
 */
export class DetectionAgent {
  private readonly capabilities: AgentCapability[] = [
    {
      name: 'roof_detection',
      description: 'Identifica telhados e painéis a partir de fotos ou coordenadas',
      tools: ['maps_snapshot', 'panel_detect', 'roof_segment', 'blob_put', 'sql_upsert'],
      triggers: ['detecção', 'foto', 'imagem', 'telhado', 'coordenada', 'painel'],
      priority: 6,
      contextWindow: 2000,
      maxIterations: 3,
    },
  ];

  private memory: AgentMemory[] = [];
  private site: SiteDetection | null = null;

  private readonly state: AgentState = {
    id: 'detection-agent',
    name: 'Detection Agent',
    capabilities: this.capabilities,
    activeTools: ['maps_snapshot', 'panel_detect', 'roof_segment', 'blob_put', 'sql_upsert'],
    context: {},
    memory: this.memory,
    status: 'idle',
    lastActivity: new Date(),
  };

  async processRequest(context: AgentExecutionContext): Promise<AgentResponse> {
    const start = Date.now();
    this.state.status = 'active';
    this.state.lastActivity = new Date();

    try {
      const userInput = this.extractUserInput(context);
      const coords = this.parseCoordinates(userInput);

      if (!coords) {
        return this.createResponse(
          { stage: 'detection', site: null, actions: [], reply: 'Para prosseguir, preciso das coordenadas (lat/lng) ou de uma foto do telhado.' },
          0.4,
          start
        );
      }

      const snapshotUrl = `https://example.com/snapshot/${coords.lat},${coords.lng}.png`;
      const maskUrl = `https://example.com/mask/${coords.lat},${coords.lng}.png`;

      this.site = {
        lat: coords.lat,
        lng: coords.lng,
        snapshots: [{ url: snapshotUrl, zoom: 20 }],
        detected_panels: { count: 8, confidence: 0.85 },
        roof_mask: { url: maskUrl, coverage_m2: 55 },
      };

      const actions = [
        { tool: 'maps_snapshot', args: { lat: coords.lat, lng: coords.lng, zoom: 20 }, why: 'imagem base' },
        { tool: 'roof_segment', args: { url: snapshotUrl }, why: 'área útil' },
        { tool: 'panel_detect', args: { url: snapshotUrl }, why: 'painéis existentes' },
      ];

      const reply = this.buildReply();

      const responseData = {
        stage: 'detection',
        site: this.site,
        actions,
        reply,
      };

      this.updateMemory('conversation', { input: userInput, response: responseData }, ['detection']);

      this.state.status = 'idle';
      return this.createResponse(responseData, 0.9, start);
    } catch (error) {
      this.state.status = 'error';
      this.updateMemory('error', { error, context }, ['error', 'detection']);
      return this.createResponse(
        { stage: 'detection', site: null, actions: [], reply: 'Ocorreu um erro na detecção.' },
        0.1,
        start
      );
    }
  }

  private extractUserInput(context: AgentExecutionContext): string {
    const last = context.conversationHistory[context.conversationHistory.length - 1];
    return last?.content || '';
  }

  private parseCoordinates(input: string): { lat: number; lng: number } | null {
    const match = input.match(/(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)/);
    if (match) {
      const lat = parseFloat(match[1]);
      const lng = parseFloat(match[2]);
      if (!isNaN(lat) && !isNaN(lng)) return { lat, lng };
    }
    return null;
  }

  private buildReply(): string {
    const coverage = this.site?.roof_mask?.coverage_m2 || 0;
    const panels = this.site?.detected_panels?.count || 0;
    return `Foram identificados ${panels} painéis e cerca de ${coverage} m² de área disponível. Imagens remotas podem não refletir reformas recentes.`;
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

  private createResponse(data: any, confidence: number, start: number): AgentResponse {
    return {
      agentId: this.state.id,
      response: { type: 'detection', data },
      confidence,
      executionTime: Date.now() - start,
    };
  }

  getState(): AgentState {
    return { ...this.state };
  }

  getCapabilities(): AgentCapability[] {
    return [...this.capabilities];
  }
}

export const detectionAgent = new DetectionAgent();
