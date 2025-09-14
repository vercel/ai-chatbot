import { z } from 'zod';
import { customAlphabet } from 'nanoid';
import { OmniValidationError, summarizeZodError } from './errors';

const nanoid = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyz', 16);

/** Channels supported by the omnichannel platform */
export const ChannelSchema = z.enum([
  'whatsapp',
  'email',
  'sms',
  'telegram',
  'instagram',
  'linkedin',
  'web',
  'voice',
]);
export type Channel = z.infer<typeof ChannelSchema>;

/** Contact reference used for participants (from/to) */
export const ContactRefSchema = z.object({
  id: z.string().min(1),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  displayName: z.string().optional(),
  handles: z.record(z.string(), z.string()).optional(),
});
export type ContactRef = z.infer<typeof ContactRefSchema>;

/** Attachment metadata for media messages */
export const AttachmentSchema = z.object({
  url: z.string().url(),
  mime: z.string().min(1),
  size: z.number().int().positive().optional(),
  caption: z.string().optional(),
});
export type Attachment = z.infer<typeof AttachmentSchema>;

/**
 * Canonical message schema shared across API, Bus and Agents
 * - timestamp is stored as number (epoch ms); coerce accepts ISO string/number
 */
export const MessageCanonicalSchema = z.object({
  id: z.string().min(1),
  channel: ChannelSchema,
  direction: z.enum(['in', 'out']),
  conversationId: z.string().min(1),
  from: ContactRefSchema,
  to: ContactRefSchema,
  timestamp: z.number().int().nonnegative(),
  text: z.string().optional(),
  media: AttachmentSchema.optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});
export type MessageCanonical = z.infer<typeof MessageCanonicalSchema>;

export const InboundEnvelopeSchema = z.object({
  message: MessageCanonicalSchema.extend({ direction: z.literal('in') }),
});
export const OutboundEnvelopeSchema = z.object({
  message: MessageCanonicalSchema.extend({ direction: z.literal('out') }),
});
export type InboundEnvelope = z.infer<typeof InboundEnvelopeSchema>;
export type OutboundEnvelope = z.infer<typeof OutboundEnvelopeSchema>;

/** Normalize timestamp input (number or ISO string) into epoch ms */
function normalizeTimestamp(ts: unknown): number {
  if (typeof ts === 'number') return ts;
  if (typeof ts === 'string') {
    const ms = Date.parse(ts);
    if (!Number.isNaN(ms)) return ms;
  }
  return Date.now();
}

/**
 * Coerce arbitrary payload into a valid inbound envelope.
 * Fills defaults for id/timestamp and enforces direction='in'.
 */
export function coerceInbound(payload: unknown): InboundEnvelope {
  try {
    // Accept either bare message or { message }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const raw = (payload as any)?.message ? (payload as any) : { message: payload };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const m: any = raw.message || {};
    const coerced = {
      message: {
        id: m.id || nanoid(),
        channel: m.channel,
        direction: 'in' as const,
        conversationId: m.conversationId || m.threadId || nanoid(),
        from: m.from,
        to: m.to,
        timestamp: normalizeTimestamp(m.timestamp),
        text: m.text,
        media: m.media,
        metadata: m.metadata,
      },
    };
    return InboundEnvelopeSchema.parse(coerced);
  } catch (e) {
    throw new OmniValidationError(`inbound_invalid: ${summarizeZodError(e)}`, e);
  }
}

/**
 * Coerce arbitrary payload into a valid outbound envelope.
 * Fills defaults for id/timestamp and enforces direction='out'.
 */
export function coerceOutbound(payload: unknown): OutboundEnvelope {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const raw = (payload as any)?.message ? (payload as any) : { message: payload };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const m: any = raw.message || {};
    const coerced = {
      message: {
        id: m.id || nanoid(),
        channel: m.channel,
        direction: 'out' as const,
        conversationId: m.conversationId || m.threadId || nanoid(),
        from: m.from,
        to: m.to,
        timestamp: normalizeTimestamp(m.timestamp),
        text: m.text,
        media: m.media,
        metadata: m.metadata,
      },
    };
    return OutboundEnvelopeSchema.parse(coerced);
  } catch (e) {
    throw new OmniValidationError(`outbound_invalid: ${summarizeZodError(e)}`, e);
  }
}

/** Type guards */
export function isInbound(env: unknown): env is InboundEnvelope {
  try {
    InboundEnvelopeSchema.parse(env);
    return true;
  } catch {
    return false;
  }
}

export function isOutbound(env: unknown): env is OutboundEnvelope {
  try {
    OutboundEnvelopeSchema.parse(env);
    return true;
  } catch {
    return false;
  }
}

