import { describe, it, expect, vi, beforeEach } from 'vitest';

// We must mock redis BEFORE importing the module under test

class FakeRedisClient {
  public xAddCalls: Array<{ stream: string; message: Record<string, string> }> = [];
  public setCalls: Array<{ key: string; value: string; opts: any }> = [];
  private published = new Map<string, string>();
  private sets = new Map<string, string>();

  async connect() { /* no-op */ }
  async quit() { /* no-op */ }

  async set(key: string, value: string, opts?: any) {
    this.setCalls.push({ key, value, opts });
    // Respect NX semantics
    if (opts?.NX) {
      if (this.sets.has(key)) return null;
      this.sets.set(key, value);
      return 'OK';
    }
    this.sets.set(key, value);
    return 'OK';
  }

  async xAdd(stream: string, _id: string, message: Record<string, string>) {
    this.xAddCalls.push({ stream, message });
    const id = String(this.xAddCalls.length) + '-0';
    this.published.set(id, JSON.stringify(message));
    return id;
  }
}

describe('dedupe SET NX logic', () => {
  let fake: FakeRedisClient;

  beforeEach(() => {
    fake = new FakeRedisClient();
    vi.resetModules();
    vi.doMock('redis', () => ({
      createClient: vi.fn(() => fake),
    }));
    process.env.REDIS_URL = 'redis://test';
    process.env.OMNI_OUTBOX_DEDUPE = 'true';
    process.env.OMNI_STREAM_OUTBOX = 'omni.outbox';
    process.env.OMNI_OUTBOX_DEDUPE_TTL = '600';
  });

  it('publishes once with SET NX and EX options', async () => {
    const { send_message } = await import('@/agents/tools/send_message');

    const envelope = {
      message: {
        id: 'msg-1',
        channel: 'whatsapp',
        direction: 'out' as const,
        conversationId: 'conv-1',
        from: { id: 'agent:bot' },
        to: { id: 'user:1', phone: '+123' },
        timestamp: Date.now(),
        text: 'Hi',
      },
    };

    const r1 = await send_message(envelope as any);
    expect(r1.id).toBe('msg-1');

    // SET called with NX + EX
    expect(fake.setCalls.length).toBe(1);
    const call = fake.setCalls[0];
    expect(call.key).toBe('omni:outbox:dedupe:msg-1');
    expect(call.opts?.NX).toBe(true);
    expect(typeof call.opts?.EX).toBe('number');
    // published exactly once
    expect(fake.xAddCalls.length).toBe(1);
    expect(fake.xAddCalls[0].stream).toBe('omni.outbox');

    // Second call: deduped, no publish
    const r2 = await send_message(envelope as any);
    expect(r2.id).toBe('msg-1');
    expect(fake.setCalls.length).toBe(2); // SET attempted again
    expect(fake.xAddCalls.length).toBe(1); // still one publish
  });
});

