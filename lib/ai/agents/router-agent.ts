/**
 * Agente Roteador Omnicanal
 * Responsável por identificar intenção, selecionar modelo e encaminhar para próximos agentes
 */

export type RouterIntent =
  | 'sales/presales'
  | 'support/tech'
  | 'billing/finance'
  | 'lead/qualification'
  | 'appointment/schedule'
  | 'other';

export type PersonaMode = 'owner' | 'integrator' | 'guest' | 'regular';

export type NextAgent =
  | 'investigation'
  | 'detection'
  | 'analysis'
  | 'dimensioning'
  | 'recommendation'
  | 'support'
  | 'billing'
  | 'self';

export interface RouterAction {
  tool: string;
  args: Record<string, unknown>;
  why: string;
}

export interface RouterResponse {
  intent: RouterIntent;
  persona_mode: PersonaMode;
  model_hint: string;
  next_agent: NextAgent;
  actions: RouterAction[];
  reply: string;
  follow_up: string[];
}

export interface HostContext {
  persona: {
    mode: PersonaMode;
    permissions: string[];
    featureFlags: Record<string, boolean>;
  };
  auth: {
    userId?: string;
    quota: { usedToday: number; limit: number };
  };
  providers: {
    gateway: string;
    defaultModel: string;
    fallbacks: string[];
  };
}

function detectIntent(message: string): RouterIntent {
  const text = message.toLowerCase();
  if (/venda|preço|proposta|comprar/.test(text)) return 'sales/presales';
  if (/suporte|técnico|erro|bug/.test(text)) return 'support/tech';
  if (/fatura|boleto|pagamento|cobrança/.test(text)) return 'billing/finance';
  if (/lead|prospect|qualifica/.test(text)) return 'lead/qualification';
  if (/agendar|agenda|marcar|horário/.test(text)) return 'appointment/schedule';
  return 'other';
}

function selectModel(ctx: HostContext): string {
  return ctx.persona.mode === 'guest' ? ctx.providers.defaultModel : 'gpt-4.1';
}

function selectNextAgent(intent: RouterIntent): NextAgent {
  switch (intent) {
    case 'support/tech':
      return 'support';
    case 'billing/finance':
      return 'billing';
    default:
      return 'analysis';
  }
}

export function route(message: string, ctx: HostContext): RouterResponse {
  const modelHint = selectModel(ctx);

  if (ctx.auth.quota.usedToday >= ctx.auth.quota.limit) {
    return {
      intent: 'other',
      persona_mode: ctx.persona.mode,
      model_hint: modelHint,
      next_agent: 'self',
      actions: [],
      reply: 'Desculpe, sua cota diária foi atingida. Tente novamente amanhã.',
      follow_up: ['Tentar novamente amanhã', 'Falar com nosso time de suporte'],
    };
  }

  const intent = detectIntent(message);
  const nextAgent = selectNextAgent(intent);

  return {
    intent,
    persona_mode: ctx.persona.mode,
    model_hint: modelHint,
    next_agent: nextAgent,
    actions: [],
    reply: `Solicitação encaminhada para ${nextAgent}.`,
    follow_up: ['Precisa de mais alguma coisa?', 'Ver opções disponíveis'],
  };
}
