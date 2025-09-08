'use client';

import { PhaseMessage } from './multi-agent/phase-message';
import type { AgentPhase } from './multi-agent/phase';
import { PreviewMessage } from './message';
import type { Vote } from '@/lib/db/schema';
import type { UseChatHelpers } from '@ai-sdk/react';
import type { ChatMessage } from '@/lib/types';

// Função para detectar se uma mensagem é de um co-agente baseado no conteúdo
function detectAgentPhase(message: ChatMessage): AgentPhase | null {
  if (message.role !== 'assistant') return null;

  const textContent = message.parts
    .filter((part) => part.type === 'text')
    .map((part) => part.text)
    .join(' ')
    .toLowerCase();

  // Padrões mais específicos para detectar fases da jornada solar
  const phasePatterns: Record<AgentPhase, string[]> = {
    investigation: [
      'investigação',
      'investigar',
      'classificar intenção',
      'lead validation',
      'analisar conta',
      'conta de luz',
      'endereço',
      'dados do cliente',
      'qualificar lead',
      'validação inicial',
    ],
    detection: [
      'detecção',
      'detectar',
      'painéis solares',
      'telhado',
      'roof analysis',
      'análise de telhado',
      'identificar painéis',
      'detecção automática',
      'análise visual',
      'inspeção remota',
    ],
    analysis: [
      'análise',
      'analisar',
      'consumo elétrico',
      'viabilidade técnica',
      'análise financeira',
      'retorno do investimento',
      'roi',
      'payback',
      'custos',
      'benefícios',
      'análise de mercado',
    ],
    sizing: [
      'dimensionamento',
      'tamanho do sistema',
      'capacidade',
      'potência',
      'layout',
      'otimização',
      'configuração',
      'especificações técnicas',
      'dimensionar sistema',
      'calcular tamanho',
    ],
    recommendation: [
      'recomendação',
      'recomendar',
      'proposta',
      'contrato',
      'oferta',
      'solução recomendada',
      'plano de ação',
      'estratégia',
      'sugestão final',
    ],
  };

  // Verificar se há menção explícita a agentes/co-agentes
  const agentKeywords = ['agente', 'co-agente', 'assistente', 'especialista'];
  const hasAgentMention = agentKeywords.some((keyword) =>
    textContent.includes(keyword),
  );

  if (hasAgentMention) {
    // Se menciona agente, tentar identificar a fase pelo contexto
    for (const [phase, patterns] of Object.entries(phasePatterns)) {
      if (patterns.some((pattern) => textContent.includes(pattern))) {
        return phase as AgentPhase;
      }
    }
  }

  // Verificar padrões específicos sem menção explícita a agente
  for (const [phase, patterns] of Object.entries(phasePatterns)) {
    const matches = patterns.filter((pattern) => textContent.includes(pattern));
    if (matches.length >= 2) {
      // Pelo menos 2 padrões para maior confiança
      return phase as AgentPhase;
    }
  }

  return null;
}

interface AgentMessageWrapperProps {
  readonly chatId: string;
  readonly message: ChatMessage;
  readonly vote: Vote | undefined;
  readonly isLoading: boolean;
  readonly setMessages: UseChatHelpers<ChatMessage>['setMessages'];
  readonly regenerate: UseChatHelpers<ChatMessage>['regenerate'];
  readonly isReadonly: boolean;
  readonly requiresScrollPadding: boolean;
  readonly isArtifactVisible: boolean;
}

export function AgentMessageWrapper({
  chatId,
  message,
  vote,
  isLoading,
  setMessages,
  regenerate,
  isReadonly,
  requiresScrollPadding,
  isArtifactVisible,
}: AgentMessageWrapperProps) {
  const agentPhase = detectAgentPhase(message);

  if (agentPhase) {
    // Se for uma mensagem de co-agente, renderiza com PhaseMessage
    const textContent = message.parts
      .filter((part) => part.type === 'text')
      .map((part) => part.text)
      .join(' ');

    return (
      <div className="space-y-2">
        <PhaseMessage phase={agentPhase} isLoading={isLoading}>
          {textContent}
        </PhaseMessage>
        {/* Renderiza também a mensagem normal para manter compatibilidade */}
        <PreviewMessage
          chatId={chatId}
          message={message}
          vote={vote}
          isLoading={isLoading}
          setMessages={setMessages}
          regenerate={regenerate}
          isReadonly={isReadonly}
          requiresScrollPadding={requiresScrollPadding}
          isArtifactVisible={isArtifactVisible}
        />
      </div>
    );
  }

  // Caso contrário, renderiza a mensagem normal
  return (
    <PreviewMessage
      chatId={chatId}
      message={message}
      vote={vote}
      isLoading={isLoading}
      setMessages={setMessages}
      regenerate={regenerate}
      isReadonly={isReadonly}
      requiresScrollPadding={requiresScrollPadding}
      isArtifactVisible={isArtifactVisible}
    />
  );
}
