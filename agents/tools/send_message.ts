import { z } from 'zod';
import { coerceOutbound, type OutboundEnvelope, Channel, ChannelSchema, ContactRefSchema } from '@/lib/omni/schema';
import { publishWithRetry } from '@/lib/omni/bus';

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
    const id = await publishWithRetry(process.env.OMNI_STREAM_OUTBOX || 'omni.outbox', env.message);
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

  const id = await publishWithRetry(process.env.OMNI_STREAM_OUTBOX || 'omni.outbox', envelope.message);
  return { id, channel: envelope.message.channel, text: envelope.message.text || '' };
}
