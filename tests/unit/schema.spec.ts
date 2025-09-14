import { describe, it, expect } from 'vitest';
import { coerceInbound, coerceOutbound, isInbound, isOutbound } from '@/lib/omni/schema';
import {
  exampleInboundWhatsAppValid,
  exampleOutboundEmailValid,
  exampleInboundInvalidMissingTo,
  exampleOutboundInvalidWrongChannel,
} from '@/lib/omni/examples';

describe('Omni Canonical Schema', () => {
  it('coerces valid inbound', () => {
    const env = coerceInbound(exampleInboundWhatsAppValid);
    expect(isInbound(env)).toBe(true);
    expect(env.message.direction).toBe('in');
    expect(env.message.channel).toBe('whatsapp');
    expect(env.message.from.id).toContain('user:');
  });

  it('coerces valid outbound', () => {
    const env = coerceOutbound(exampleOutboundEmailValid);
    expect(isOutbound(env)).toBe(true);
    expect(env.message.direction).toBe('out');
    expect(env.message.channel).toBe('email');
  });

  it('rejects invalid inbound (missing to)', () => {
    expect(() => coerceInbound(exampleInboundInvalidMissingTo)).toThrow(/inbound_invalid/i);
  });

  it('rejects invalid outbound (wrong channel)', () => {
    // @ts-expect-error runtime validation case
    expect(() => coerceOutbound(exampleOutboundInvalidWrongChannel)).toThrow(/outbound_invalid/i);
  });
});

