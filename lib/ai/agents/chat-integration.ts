/**
 * Integração do Sistema de Agentes com o Chat
 * Conecta agentes especializados ao sistema de chat principal
 */

import { agentOrchestrator } from './agent-system';
import { toolSystem } from '../tools/tool-system';
import { AgentExecutionContext, AgentResponse } from '../tools/types';
import { ChatMessage } from '../../../apps/web/lib/chat/types';

// Hook para usar agentes no chat
export function useAgentIntegration() {
  const processWithAgents = async (
    messages: ChatMessage[],
    userId: string,
    sessionId: string
  ): Promise<AgentResponse | null> => {
    // Verificar se a mensagem atual pode ser processada por agentes
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage || lastMessage.role !== 'user') {
      return null;
    }

    // Criar contexto de execução para agentes
    const agentContext: AgentExecutionContext = {
      agentId: 'chat-integration',
      userId,
      sessionId,
      currentPhase: 'active',
      availableTools: toolSystem.getAvailableTools(),
      conversationHistory: messages.map(msg => ({
        id: msg.id,
        content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content),
        role: msg.role,
        timestamp: msg.createdAt || new Date(),
      })),
      metadata: {
        source: 'chat',
        messageCount: messages.length,
      },
    };

    try {
      // Processar com orquestrador de agentes
      const agentResponse = await agentOrchestrator.processRequest(agentContext);

      // Verificar se o agente teve uma resposta útil
      if (agentResponse.confidence > 0.6) {
        return agentResponse;
      }

      return null;
    } catch (error) {
      console.error('Agent processing error:', error);
      return null;
    }
  };

  const getAgentSuggestions = (messages: ChatMessage[]): string[] => {
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage || lastMessage.role !== 'user') {
      return [];
    }

    const content = typeof lastMessage.content === 'string' ? lastMessage.content : '';
    const suggestions: string[] = [];

    // Sugestões baseadas no conteúdo da mensagem
    if (content.toLowerCase().includes('solar') || content.toLowerCase().includes('painel')) {
      suggestions.push('Calcular economia com sistema solar');
      suggestions.push('Analisar viabilidade técnica');
      suggestions.push('Comparar opções de financiamento');
    }

    if (content.toLowerCase().includes('lead') || content.toLowerCase().includes('cliente')) {
      suggestions.push('Qualificar lead automaticamente');
      suggestions.push('Gerar relatório de análise');
      suggestions.push('Agendar follow-up');
    }

    if (content.toLowerCase().includes('custo') || content.toLowerCase().includes('preço')) {
      suggestions.push('Calcular ROI do investimento');
      suggestions.push('Comparar cenários de payback');
      suggestions.push('Analisar economia mensal');
    }

    return suggestions.slice(0, 3); // Máximo 3 sugestões
  };

  const getAgentHealth = () => {
    return agentOrchestrator.getSystemHealth();
  };

  const getAvailableAgents = () => {
    return agentOrchestrator.getAllAgents().map(agent => ({
      id: agent.getState().id,
      name: agent.getState().name,
      capabilities: agent.getCapabilities(),
      status: agent.getState().status,
    }));
  };

  return {
    processWithAgents,
    getAgentSuggestions,
    getAgentHealth,
    getAvailableAgents,
  };
}

// Componente para exibir respostas de agentes no chat
export function formatAgentResponse(agentResponse: AgentResponse): ChatMessage {
  const baseMessage: ChatMessage = {
    id: `agent_${Date.now()}_${Math.random()}`,
    role: 'assistant',
    content: '',
    createdAt: Date.now(),
  };

  // Formatar conteúdo baseado no tipo de resposta
  if (typeof agentResponse.response === 'string') {
    baseMessage.content = agentResponse.response;
  } else if (agentResponse.response.type === 'solar_calculation') {
    baseMessage.content = agentResponse.response.content;
  } else if (agentResponse.response.type === 'lead_analysis') {
    baseMessage.content = agentResponse.response.content;
  } else if (agentResponse.response.type === 'text') {
    baseMessage.content = agentResponse.response.content;
  } else {
    baseMessage.content = JSON.stringify(agentResponse.response);
  }

  return baseMessage;
}

// Utilitários para métricas de agentes
export function trackAgentMetrics(agentResponse: AgentResponse) {
  // Em produção, enviar métricas para sistema de monitoramento
  console.log('Agent Metrics:', {
    agentId: agentResponse.agentId,
    confidence: agentResponse.confidence,
    executionTime: agentResponse.executionTime,
    timestamp: new Date(),
  });
}

// Hook para sugestões contextuais de agentes
export function useAgentSuggestions(messages: ChatMessage[]) {
  const suggestions = [];

  if (messages.length === 0) {
    suggestions.push({
      text: 'Calcular sistema solar',
      action: 'solar_calculation',
      icon: '☀️',
    });
    suggestions.push({
      text: 'Qualificar lead',
      action: 'lead_qualification',
      icon: '👥',
    });
  }

  const lastMessage = messages[messages.length - 1];
  if (lastMessage && lastMessage.role === 'user') {
    const content = typeof lastMessage.content === 'string' ? lastMessage.content : '';

    if (content.toLowerCase().includes('custo') || content.toLowerCase().includes('preço')) {
      suggestions.push({
        text: 'Ver análise completa de custos',
        action: 'cost_analysis',
        icon: '💰',
      });
    }

    if (content.toLowerCase().includes('técnico') || content.toLowerCase().includes('instalação')) {
      suggestions.push({
        text: 'Avaliação técnica detalhada',
        action: 'technical_assessment',
        icon: '🔧',
      });
    }
  }

  return suggestions;
}

// Sistema de fallback para quando agentes não conseguem processar
export function createFallbackResponse(userMessage: string): AgentResponse {
  return {
    agentId: 'fallback',
    response: {
      type: 'text',
      content: `Entendi sua solicitação sobre "${userMessage}". Como posso ajudar com mais detalhes sobre energia solar ou qualificação de leads?`,
    },
    confidence: 0.3,
    executionTime: 0,
    metadata: {
      fallback: true,
      originalMessage: userMessage,
    },
  };
}

// Configuração de agentes para diferentes personas
export const agentConfigurations = {
  owner: {
    enabledAgents: ['solar-calculator'],
    priorityAgents: ['solar-calculator'],
    disabledFeatures: ['lead_qualification'],
  },
  integrator: {
    enabledAgents: ['solar-calculator', 'lead-qualifier'],
    priorityAgents: ['lead-qualifier', 'solar-calculator'],
    disabledFeatures: [],
  },
};

// Função para configurar agentes baseado na persona
export function configureAgentsForPersona(persona: 'owner' | 'integrator') {
  const config = agentConfigurations[persona];

  // Em produção, isso ativaria/desativaria agentes baseado na configuração
  console.log(`Configuring agents for ${persona} persona:`, config);

  return config;
}