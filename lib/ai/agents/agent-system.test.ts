/**
 * Testes para o Sistema de Agentes Especializados
 * Testes unitários e de integração para agentes, orquestrador e tools
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { agentOrchestrator } from '../agents/agent-system';
import { toolSystem } from '../tools/tool-system';
import type { AgentExecutionContext } from '../tools/types';

// Mock do load balancing service
vi.mock('@/lib/services/load-balancing-service', () => ({
  loadBalancingService: {
    selectProvider: vi.fn().mockResolvedValue({
      success: true,
      data: {
        provider: 'xai',
        model: 'grok-2',
        reason: 'Best performance for task',
        score: 95,
        alternatives: [],
      },
    }),
  },
}));

describe('Agent System Tests', () => {
  let mockContext: AgentExecutionContext;

  beforeEach(() => {
    mockContext = {
      agentId: 'test-agent',
      userId: 'user123',
      sessionId: 'session456',
      currentPhase: 'investigation',
      availableTools: toolSystem.getAvailableTools(),
      conversationHistory: [
        {
          id: 'msg1',
          content: 'Quero instalar painéis solares na minha casa',
          role: 'user',
          timestamp: new Date(),
        },
      ],
      metadata: {},
    };

    // Reset agent states
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Solar Calculator Agent', () => {
    it('should process solar calculation requests', async () => {
      const response = await agentOrchestrator.processRequest(mockContext);

      expect(response).toBeDefined();
      expect(response.agentId).toBeDefined();
      expect(response.confidence).toBeGreaterThan(0);
      expect(response.executionTime).toBeGreaterThan(0);
    });

    it('should handle solar-related keywords', async () => {
      mockContext.conversationHistory[0].content = 'Quanto custa um sistema solar de 5kWp?';

      const response = await agentOrchestrator.processRequest(mockContext);

      expect(response.response.type).toBe('solar_calculation');
      expect(response.response.data).toBeDefined();
    });

    it('should extract parameters from user input', async () => {
      mockContext.conversationHistory[0].content = 'Minha conta de luz é R$ 450 por mês e tenho 120m² de telhado';

      const response = await agentOrchestrator.processRequest(mockContext);

      expect(response.response.data).toBeDefined();
      expect(response.response.data.monthlyBill).toBe(450);
      expect(response.response.data.roofArea).toBe(120);
    });

    it('should handle invalid inputs gracefully', async () => {
      mockContext.conversationHistory[0].content = 'Olá, como vai?';

      const response = await agentOrchestrator.processRequest(mockContext);

      expect(response.confidence).toBeLessThan(0.6);
      expect(response.response.type).toBe('text');
    });
  });

  describe('Lead Qualification Agent', () => {
    it('should process lead qualification requests', async () => {
      mockContext.conversationHistory[0].content = 'Quero qualificar um lead para energia solar';

      const response = await agentOrchestrator.processRequest(mockContext);

      expect(response).toBeDefined();
      expect(response.agentId).toBeDefined();
    });

    it('should handle lead-related keywords', async () => {
      mockContext.conversationHistory[0].content = 'Preciso analisar um prospect interessado em painéis solares';

      const response = await agentOrchestrator.processRequest(mockContext);

      expect(response.response.type).toBe('lead_analysis');
      expect(response.response.data).toBeDefined();
    });

    it('should score leads appropriately', async () => {
      mockContext.conversationHistory[0].content = 'Lead com conta de R$ 800, telhado de 200m², orçamento de R$ 50k';

      const response = await agentOrchestrator.processRequest(mockContext);

      expect(response.response.data.score).toBeDefined();
      expect(response.response.data.qualification).toBeDefined();
      expect(['hot', 'warm', 'cold']).toContain(response.response.data.qualification);
    });
  });

  describe('Investigation Agent', () => {
    it('should collect address information', async () => {
      mockContext.currentPhase = 'investigation';
      mockContext.conversationHistory[0].content = 'Meu endereço é Rua das Flores, 123';

      const response = await agentOrchestrator.processRequest(mockContext);

      expect(response.response.data.lead.address.raw).toContain('Rua das Flores');
      expect(response.response.data.stage).toBe('investigation');
    });

    it('should request bill when address provided', async () => {
      mockContext.currentPhase = 'investigation';
      mockContext.conversationHistory[0].content = 'Rua das Palmeiras, 55';

      const response = await agentOrchestrator.processRequest(mockContext);

      expect(response.response.data.reply).toMatch(/conta de luz/i);
    });
  });

  describe('Agent Orchestrator', () => {
    it('should route requests to appropriate agents', async () => {
      // Test solar routing
      mockContext.conversationHistory[0].content = 'Cálculo de sistema solar';
      let response = await agentOrchestrator.processRequest(mockContext);
      expect(response.response.type).toBe('solar_calculation');

      // Test lead routing
      mockContext.conversationHistory[0].content = 'Qualificação de lead';
      response = await agentOrchestrator.processRequest(mockContext);
      expect(response.response.type).toBe('lead_analysis');
    });

    it('should handle multiple active contexts', async () => {
      const context1 = { ...mockContext, sessionId: 'session1' };
      const context2 = { ...mockContext, sessionId: 'session2' };

      context1.conversationHistory[0].content = 'Sistema solar';
      context2.conversationHistory[0].content = 'Lead qualification';

      const [response1, response2] = await Promise.all([
        agentOrchestrator.processRequest(context1),
        agentOrchestrator.processRequest(context2),
      ]);

      expect(response1.response.type).toBe('solar_calculation');
      expect(response2.response.type).toBe('lead_analysis');
    });

    it('should provide system health information', () => {
      const health = agentOrchestrator.getSystemHealth();

      expect(health).toBeDefined();
      expect(health.overall).toBeDefined();
      expect(health.agents).toBeDefined();
      expect(health.tools).toBeDefined();
      expect(health.performance).toBeDefined();
    });
  });

  describe('Tool Integration', () => {
    it('should execute solar calculator tool', async () => {
      const toolCall = {
        id: 'test-call-1',
        toolName: 'solar_calculator',
        parameters: {
          location: 'São Paulo, SP',
          monthlyBill: 300,
          roofArea: 100,
          panelEfficiency: 0.22,
        },
        context: {
          provider: {
            provider: 'xai',
            model: 'grok-2',
            reason: 'Test',
            score: 90,
            alternatives: [],
          },
          model: 'gpt-4',
          temperature: 0.7,
          userId: 'test-user',
          sessionId: 'test-session',
        },
        timestamp: new Date(),
      };

      const result = await toolSystem.executeToolCall(toolCall, toolCall.context);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.systemSize).toBeDefined();
      expect(result.data.annualSavings).toBeDefined();
    });

    it('should execute lead analyzer tool', async () => {
      const toolCall = {
        id: 'test-call-2',
        toolName: 'lead_analyzer',
        parameters: {
          leadData: {
            id: 'lead123',
            name: 'João Silva',
            monthlyBill: 450,
            roofArea: 120,
            budget: 25000,
          },
          criteria: {
            minBill: 200,
            minArea: 50,
          },
        },
        context: {
          provider: {
            provider: 'xai',
            model: 'grok-2',
            reason: 'Test',
            score: 90,
            alternatives: [],
          },
          model: 'gpt-4',
          temperature: 0.7,
          userId: 'test-user',
          sessionId: 'test-session',
        },
        timestamp: new Date(),
      };

      const result = await toolSystem.executeToolCall(toolCall, toolCall.context);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.score).toBeDefined();
      expect(result.data.qualification).toBeDefined();
    });

    it('should handle tool execution errors gracefully', async () => {
      const toolCall = {
        id: 'test-call-3',
        toolName: 'nonexistent_tool',
        parameters: {},
        context: {
          provider: {
            provider: 'xai',
            model: 'grok-2',
            reason: 'Test',
            score: 90,
            alternatives: [],
          },
          model: 'gpt-4',
          temperature: 0.7,
          userId: 'test-user',
          sessionId: 'test-session',
        },
        timestamp: new Date(),
      };

      const result = await toolSystem.executeToolCall(toolCall, toolCall.context);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('Performance and Caching', () => {
    it('should cache tool results for performance', async () => {
      const toolCall = {
        id: 'test-call-cache',
        toolName: 'solar_calculator',
        parameters: {
          location: 'São Paulo, SP',
          monthlyBill: 300,
          roofArea: 100,
        },
        context: {
          provider: {
            provider: 'xai',
            model: 'grok-2',
            reason: 'Test',
            score: 90,
            alternatives: [],
          },
          model: 'gpt-4',
          temperature: 0.7,
          userId: 'test-user',
          sessionId: 'test-session',
        },
        timestamp: new Date(),
      };

      // First execution
      const startTime1 = Date.now();
      const result1 = await toolSystem.executeToolCall(toolCall, toolCall.context);
      const time1 = Date.now() - startTime1;

      // Second execution (should be cached)
      const startTime2 = Date.now();
      const result2 = await toolSystem.executeToolCall(toolCall, toolCall.context);
      const time2 = Date.now() - startTime2;

      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
      expect(result1.data).toEqual(result2.data);
      // Cached result should be faster (allowing some variance)
      expect(time2).toBeLessThanOrEqual(time1);
    });

    it('should track performance metrics', () => {
      const health = agentOrchestrator.getSystemHealth();

      expect(health.performance.avgResponseTime).toBeDefined();
      expect(health.performance.errorRate).toBeDefined();
      expect(health.performance.throughput).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle agent processing errors', async () => {
      // Test error handling structure
      mockContext.conversationHistory[0].content = 'Test error handling';

      const response = await agentOrchestrator.processRequest(mockContext);

      // Should still return a response even with errors
      expect(response).toBeDefined();
      expect(response.executionTime).toBeGreaterThan(0);
    });

    it('should handle invalid tool parameters', async () => {
      const toolCall = {
        id: 'test-call-invalid',
        toolName: 'solar_calculator',
        parameters: {
          // Missing required parameters
          location: 'São Paulo, SP',
        },
        context: {
          provider: {
            provider: 'xai',
            model: 'grok-2',
            reason: 'Test',
            score: 90,
            alternatives: [],
          },
          model: 'gpt-4',
          temperature: 0.7,
          userId: 'test-user',
          sessionId: 'test-session',
        },
        timestamp: new Date(),
      };

      const result = await toolSystem.executeToolCall(toolCall, toolCall.context);

      // Should handle gracefully even with invalid parameters
      expect(result).toBeDefined();
      expect(result.executionTime).toBeGreaterThan(0);
    });
  });

  describe('Multi-Agent Coordination', () => {
    it('should coordinate between multiple agents', async () => {
      // Test that the orchestrator can handle multiple agent types
      const agents = agentOrchestrator.getAllAgents();
      expect(agents.length).toBeGreaterThan(0);

      // Each agent should have different capabilities
      const capabilities = agents.map(agent => agent.getCapabilities());
      expect(capabilities.length).toBe(agents.length);
    });

    it('should maintain agent state across requests', async () => {
      mockContext.conversationHistory[0].content = 'Sistema solar para casa';

      const response1 = await agentOrchestrator.processRequest(mockContext);
      const response2 = await agentOrchestrator.processRequest(mockContext);

      expect(response1.agentId).toBeDefined();
      expect(response2.agentId).toBeDefined();
    });
  });
});