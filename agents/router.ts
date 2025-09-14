import { coerceInbound, type InboundEnvelope, type OutboundEnvelope, Channel } from '@/lib/omni/schema';
import { detect_intent, type Intent } from './router/policies';
import { handleSales } from './router/handlers/sales';
import { search } from './kb/kb_search';

function supportReply(): string {
  return [
    'Posso conectar você ao nosso time de suporte.',
    'Contatos oficiais: WhatsApp +55 (21) 97920-9021, Empresa +55 (21) 99637-1563, E-mail contato@yellosolarhub.com',
  ].join(' ');
}

export async function handleIncoming(envelope: InboundEnvelope): Promise<OutboundEnvelope[]> {
  const text = envelope.message.text || '';
  const intent: Intent = detect_intent(text);
  let reply: string;

  switch (intent) {
    case 'greeting':
      reply = 'Olá! Como posso ajudar?';
      break;
    case 'budget':
      reply = handleSales();
      break;
    case 'status':
    case 'human':
      reply = supportReply();
      break;
    default: {
      const hits = search(text, 1);
      reply = hits[0]?.snippet || 'Não encontrei informação relevante agora. Poderia detalhar?';
    }
  }

  const out: OutboundEnvelope = {
    message: {
      id: `${envelope.message.id}:out`,
      channel: envelope.message.channel,
      direction: 'out',
      conversationId: envelope.message.conversationId,
      from: envelope.message.to,
      to: envelope.message.from,
      timestamp: Date.now(),
      text: reply,
      metadata: { intent },
    },
  };

  return [out];
}

// Legacy adapter kept for tests: accepts simple shape and returns intent/reply
export interface SimpleInbound {
  text: string;
  channel: Channel | string;
  fromId?: string;
  toId?: string;
  conversationId?: string;
}

export async function routeInbound(input: SimpleInbound): Promise<{ intent: string; reply: string; envelope: InboundEnvelope }>{
  const env = coerceInbound({
    channel: (input.channel as Channel) || 'web',
    direction: 'in',
    conversationId: input.conversationId || 'conv:auto',
    from: { id: input.fromId || 'user:unknown' },
    to: { id: input.toId || 'agent:system' },
    text: input.text,
    timestamp: Date.now(),
  });
  const [out] = await handleIncoming(env);
  return { intent: (out.message.metadata as any)?.intent ?? 'unknown', reply: out.message.text || '', envelope: env };
}
