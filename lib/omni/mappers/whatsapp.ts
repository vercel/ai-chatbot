import { InboundEnvelope, coerceInbound } from '../schema';

/** Minimal WhatsApp webhook shape we care about */
export interface WhatsAppWebhook {
  from: string; // phone id
  to: string; // business phone id
  timestamp?: string | number;
  text?: string;
  media?: { url: string; mime: string; caption?: string; size?: number };
  metadata?: Record<string, unknown>;
}

/** Normalize a WhatsApp webhook payload into our InboundEnvelope */
export function normalizeWhatsApp(payload: WhatsAppWebhook): InboundEnvelope {
  return coerceInbound({
    id: payload.metadata?.['id'] ?? undefined,
    channel: 'whatsapp',
    direction: 'in',
    conversationId: String(payload.metadata?.['conversationId'] ?? payload.from),
    from: { id: `wa:${payload.from}`, phone: payload.from },
    to: { id: `wa:${payload.to}`, phone: payload.to },
    timestamp: payload.timestamp ?? Date.now(),
    text: payload.text,
    media: payload.media
      ? {
          url: payload.media.url,
          mime: payload.media.mime,
          size: payload.media.size,
          caption: payload.media.caption,
        }
      : undefined,
    metadata: payload.metadata,
  });
}
