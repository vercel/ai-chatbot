import { coerceOutbound, type OutboundEnvelope, Channel } from '@/lib/omni/schema';
import { publishWithRetry } from '@/lib/omni/bus';

export interface OutboundMessage {
  channel: string;
  text: string;
  toId?: string;
  fromId?: string;
  conversationId?: string;
}

/**
 * send_message validates and (optionally) publishes to omni.outbox.
 * - Backwards compatible with legacy { channel, text } signature used in tests.
 */
export async function send_message(msg: OutboundMessage | OutboundEnvelope): Promise<OutboundMessage> {
  // If caller already provides envelope, validate and (optionally) publish
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const asAny = msg as any;
  if (asAny?.message) {
    const env = coerceOutbound(asAny);
    if (process.env.OMNI_PUBLISH_OUTBOX === 'true') {
      await publishWithRetry(process.env.OMNI_STREAM_OUTBOX || 'omni.outbox', env.message);
    }
    return { channel: env.message.channel, text: env.message.text || '' };
  }

  // Legacy path: construct a minimal envelope from { channel, text, ... }
  const envelope = coerceOutbound({
    channel: (msg.channel as Channel) || 'web',
    to: { id: msg.toId || 'user:unknown' },
    from: { id: msg.fromId || 'agent:system' },
    conversationId: msg.conversationId || 'conv:ad-hoc',
    timestamp: Date.now(),
    text: msg.text,
  });

  if (process.env.OMNI_PUBLISH_OUTBOX === 'true') {
    await publishWithRetry(process.env.OMNI_STREAM_OUTBOX || 'omni.outbox', envelope.message);
  }

  return { channel: envelope.message.channel, text: envelope.message.text || '' };
}
