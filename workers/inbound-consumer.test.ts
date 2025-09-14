import { describe, it, expect, beforeEach, vi } from 'vitest';
import { InboundConsumer } from './inbound-consumer';

interface PendingInfo {
  consumer: string;
  timestamp: number;
  message: { id: string; message: Record<string, string> };
}

interface StreamState {
  messages: Array<{ id: string; message: Record<string, string> }>;
  groups: Map<string, { lastIndex: number }>;
  pending: Map<string, PendingInfo>;
  nextId: number;
}

class FakeRedis {
  streams = new Map<string, StreamState>();
  hashes = new Map<string, Record<string, string>>();

  async xAdd(stream: string, _id: string, message: Record<string, string>) {
    const s = this.streams.get(stream) ?? {
      messages: [] as Array<{ id: string; message: Record<string, string> }>,
      groups: new Map<string, { lastIndex: number }>(),
      pending: new Map<string, PendingInfo>(),
      nextId: 1,
    };
    const msgId = `${s.nextId}-0`;
    s.nextId++;
    const msg = { id: msgId, message };
    s.messages.push(msg);
    this.streams.set(stream, s);
    return msgId;
  }

  async xGroupCreate(stream: string, group: string) {
    const s = this.streams.get(stream) ?? {
      messages: [] as Array<{ id: string; message: Record<string, string> }>,
      groups: new Map<string, { lastIndex: number }>(),
      pending: new Map<string, PendingInfo>(),
      nextId: 1,
    };
    if (s.groups.has(group)) throw new Error('BUSYGROUP');
    s.groups.set(group, { lastIndex: 0 });
    this.streams.set(stream, s);
  }

  async xReadGroup(_group: string, consumer: string, keys: Array<{ key: string }>) {
    const key = keys[0].key;
    const s = this.streams.get(key);
    if (!s) return null;
    const g = s.groups.get('router');
    if (!g) return null;
    if (g.lastIndex >= s.messages.length) return null;
    const msg = s.messages[g.lastIndex];
    g.lastIndex++;
    s.pending.set(msg.id, { consumer, timestamp: Date.now(), message: msg });
    return [{ name: key, messages: [msg] }];
  }

  async xAutoClaim(stream: string, _group: string, consumer: string, minIdle: number) {
    const s = this.streams.get(stream);
    if (!s) return ['0-0', []] as const;
    const now = Date.now();
    const claimed: Array<{ id: string; message: Record<string, string> }> = [];
    for (const [id, info] of s.pending) {
      if (now - info.timestamp >= minIdle) {
        info.consumer = consumer;
        info.timestamp = now;
        claimed.push({ id, message: info.message.message });
      }
    }
    return ['0-0', claimed] as const;
  }

  async xAck(stream: string, _group: string, id: string) {
    const s = this.streams.get(stream);
    if (!s) return 0;
    return s.pending.delete(id) ? 1 : 0;
  }

  async hSet(key: string, obj: Record<string, string>) {
    const h = this.hashes.get(key) ?? {};
    Object.assign(h, obj);
    this.hashes.set(key, h);
    return 1;
  }
}

describe('InboundConsumer', () => {
  let redis: FakeRedis;
  let consumer: InboundConsumer;

  beforeEach(async () => {
    redis = new FakeRedis();
    consumer = new InboundConsumer(redis as unknown as any, { retryMs: 0, pollMs: 0 });
    await consumer.init();
    vi.resetAllMocks();
  });

  it('routes inbound and publishes outbound', async () => {
    const inbound = {
      id: 'm1',
      channel: 'whatsapp',
      direction: 'in',
      conversationId: 'conv-1',
      from: { id: 'user:123' },
      to: { id: 'agent:bot' },
      timestamp: Date.now(),
      text: 'Oi',
    };

    await redis.xAdd('omni.messages', '*', { payload: JSON.stringify(inbound) });
    await consumer.runOnce();

    const out = redis.streams.get('omni.outbox');
    expect(out?.messages.length).toBe(1);
    const rec = out?.messages[0]?.message as Record<string, string>;
    const parsed = JSON.parse(rec.payload);
    expect(parsed.direction).toBe('out');
    expect(parsed.text).toBeTruthy();
  });
});

