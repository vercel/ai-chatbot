import { coerceInbound, type InboundEnvelope, Channel } from '@/lib/omni/schema';
import { triage } from './router/triage';

export interface SimpleInbound {
  text: string;
  channel: Channel | string;
  fromId?: string;
  toId?: string;
  conversationId?: string;
}

/**
 * Adapter that accepts a simple shape and normalizes to InboundEnvelope,
 * then forwards to the existing triage router.
 */
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

  const result = await triage({ text: env.message.text || '', channel: env.message.channel });
  return { intent: result.intent, reply: result.reply, envelope: env };
}

