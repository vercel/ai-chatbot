import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import * as inbox from '@/app/api/omni/inbox/route';
import * as outbox from '@/app/api/omni/outbox/route';

vi.mock('@/lib/omni/bus', () => ({
  publishWithRetry: vi.fn(async () => '1-0'),
}));

describe('Omni API integration (contract)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('POST /api/omni/inbox accepts inbound envelope', async () => {
    const body = {
      message: {
        channel: 'whatsapp',
        direction: 'in',
        conversationId: 'conv-abc',
        from: { id: 'user:1' },
        to: { id: 'agent:1' },
        timestamp: Date.now(),
        text: 'Oi',
      },
    };
    const req = new NextRequest('http://test', { method: 'POST', body: JSON.stringify(body) });
    const res = await inbox.POST(req);
    expect(res.status).toBe(200);
  });

  it('POST /api/omni/outbox rejects invalid payload', async () => {
    const body = { message: { channel: 'email', direction: 'out', text: 'x' } };
    const req = new NextRequest('http://test', { method: 'POST', body: JSON.stringify(body) });
    const res = await outbox.POST(req);
    expect(res.status).toBeGreaterThanOrEqual(400);
  });

  it('POST /api/omni/outbox accepts outbound envelope', async () => {
    const body = {
      message: {
        channel: 'email',
        direction: 'out',
        conversationId: 'conv-xyz',
        from: { id: 'agent:bot', email: 'bot@ysh.energy' },
        to: { id: 'user:c', email: 'c@example.com' },
        timestamp: Date.now(),
        text: 'Proposta pronta',
      },
    };
    const req = new NextRequest('http://test', { method: 'POST', body: JSON.stringify(body) });
    const res = await outbox.POST(req);
    expect(res.status).toBe(200);
  });
});

