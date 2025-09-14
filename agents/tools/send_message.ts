import { z } from 'zod';
import { coerceOutbound, type OutboundEnvelope, Channel, ChannelSchema, ContactRefSchema } from '@/lib/omni/schema';
import { publishWithRetry } from '@/lib/omni/bus';
import { createClient } from 'redis';

const ParamsSchema = z.object({
  channel: ChannelSchema,
  to: ContactRefSchema,
  text: z.string().min(1),
  conversationId: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type SendParams = z.infer<typeof ParamsSchema>;

/**
 * send_message valida os parâmetros e publica imediatamente no outbox.
 * Compatível com chamadas legadas { channel, text } (usa destinatário padrão).
 */
export async function send_message(input: OutboundEnvelope | Partial<SendParams> & { text: string; channel: string }): Promise<{ id: string; channel: Channel; text: string }>{
  // Envelope direto
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const asAny = input as any;
  if (asAny?.message) {
    const env = coerceOutbound(asAny);
    const id = await dedupAndPublish(env.message.id, env);
    return { id, channel: env.message.channel, text: env.message.text || '' };
  }

  // Parâmetros (com fallback de compatibilidade)
  let params: SendParams;
  if ((input as any).to) {
    params = ParamsSchema.parse(input);
  } else {
    // Compat: destinatário padrão quando não fornecido
    params = ParamsSchema.parse({
      channel: (input.channel as Channel) || 'web',
      to: { id: 'user:unknown' },
      text: input.text,
      conversationId: (input as any).conversationId,
      metadata: (input as any).metadata,
    });
  }

  const envelope = coerceOutbound({
    channel: params.channel,
    direction: 'out',
    conversationId: params.conversationId || 'conv:ad-hoc',
    from: { id: 'agent:system' },
    to: params.to,
    timestamp: Date.now(),
    text: params.text,
    metadata: params.metadata,
  });

  const id = await dedupAndPublish(envelope.message.id, envelope);
  return { id, channel: envelope.message.channel, text: envelope.message.text || '' };
}

async function dedupAndPublish(messageId: string, env: OutboundEnvelope): Promise<string> {
  const stream = process.env.OMNI_STREAM_OUTBOX || 'omni.outbox';
  const enable = process.env.OMNI_OUTBOX_DEDUPE !== 'false';
  if (!enable) return publishWithRetry(stream, env.message);

  const ttl = Number.parseInt(process.env.OMNI_OUTBOX_DEDUPE_TTL || '600', 10);
  const key = `omni:outbox:dedupe:${messageId}`;
  const url = process.env.REDIS_URL;
  if (!url) return publishWithRetry(stream, env.message);
  const client = createClient({ url });
  try {
    await client.connect();
    // Prefer SET with NX for atomicity
    // @ts-ignore node-redis types allow options
    const res = await (client as any).set(key, '1', { NX: true, EX: ttl });
    if (res === null) {
      // already published
      await client.quit();
      return messageId;
    }
    await client.quit();
    return publishWithRetry(stream, env.message);
  } catch {
    try { await client.quit(); } catch {}
    // Fallback: publish even if dedupe failed
    return publishWithRetry(stream, env.message);
  }
}
