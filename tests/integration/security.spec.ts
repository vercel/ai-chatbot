import { describe, it, expect, beforeEach } from 'vitest';
import { POST as outboxPOST } from '@/app/api/omni/outbox/route';
import { sanitizePayload, redactForLog } from '@/lib/security/sanitize';

describe('security: rate limiting and sanitization', () => {
  beforeEach(() => {
    process.env.RATE_LIMIT_RPS = '1';
    process.env.RATE_LIMIT_BURST = '1';
    delete (process as any).env.REDIS_URL; // use in-memory limiter in tests
  });

  it('rate limits repeated outbox calls', async () => {
    const req1 = new Request('http://localhost/api/omni/outbox', {
      method: 'POST',
      headers: { 'x-forwarded-for': '1.1.1.1' },
      body: JSON.stringify({
        channel: 'web', direction: 'out', conversationId: 'c1', from: { id: 'a' }, to: { id: 'b' }, timestamp: Date.now(), text: 'hi'
      }),
    });
    const r1 = await outboxPOST(req1 as any);
    expect((r1 as Response).status).toBeLessThan(429);

    const req2 = new Request('http://localhost/api/omni/outbox', {
      method: 'POST',
      headers: { 'x-forwarded-for': '1.1.1.1' },
      body: JSON.stringify({
        channel: 'web', direction: 'out', conversationId: 'c1', from: { id: 'a' }, to: { id: 'b' }, timestamp: Date.now(), text: 'hi'
      }),
    });
    const r2 = await outboxPOST(req2 as any);
    expect((r2 as Response).status).toBe(429);
  });

  it('sanitizes sensitive fields', () => {
    const input = { password: 'p', token: 't', apiKey: 'k', email: 'user@example.com', nested: { email: 'a@b.com' } };
    const sanitized = sanitizePayload(input);
    expect((sanitized as any).password).toBeUndefined();
    expect((sanitized as any).token).toBeUndefined();
    expect((sanitized as any).apiKey).toBeUndefined();
    expect((sanitized as any).email).toMatch(/\*@/);
    const red = redactForLog({ text: 'long text should be trimmed to a smaller size with more chars', from: { id: 'user:abcdef' } });
    expect(red.text.length).toBeLessThan(60);
    expect(red.from.id).toMatch(/\*\*\*....$/);
  });
});

