import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import http from 'node:http';
import app from '@/scripts/mcp-sim';
import { InboundConsumer } from '@/workers/inbound-consumer';
import { Dispatcher } from '@/workers/dispatcher';

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

  async xReadGroup(group: string, consumer: string, keys: Array<{ key: string }>) {
    const key = keys[0].key;
    const s = this.streams.get(key);
    if (!s) return null;
    const g = s.groups.get(group);
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

describe('E2E inbound → outbox → dispatcher → MCP', () => {
  let server: http.Server;
  let baseURL = '';
  let redis: FakeRedis;

  beforeAll(async () => {
    // Start MCP simulator
    server = app.listen(0);
    await new Promise((r) => server.once('listening', r));
    const addr = server.address();
    const port = typeof addr === 'object' && addr ? addr.port : 0;
    baseURL = `http://127.0.0.1:${port}`;
    process.env.MCP_WHATSAPP_URL = baseURL;
    process.env.MCP_TOKEN = 'dev-token';
  });

  afterAll(async () => {
    await new Promise((r) => server.close(() => r(null)));
  });

  beforeEach(() => {
    vi.resetModules();
    redis = new FakeRedis();

    // Mock redis client used by publishWithRetry and dedupe
    const setStore = new Map<string, string>();
    const createClient = () => ({
      async connect() { /* no-op */ },
      async quit() { /* no-op */ },
      async set(key: string, value: string, opts?: any) {
        if (opts?.NX) {
          if (setStore.has(key)) return null;
          setStore.set(key, value);
          return 'OK';
        }
        setStore.set(key, value);
        return 'OK';
      },
      async xAdd(stream: string, id: string, message: Record<string, string>) {
        return redis.xAdd(stream, id, message);
      },
    });
    vi.doMock('redis', () => ({ createClient }));

    process.env.REDIS_URL = 'redis://test';
    process.env.OMNI_OUTBOX_DEDUPE = 'true';
    process.env.OMNI_STREAM_MESSAGES = 'omni.messages';
    process.env.OMNI_STREAM_OUTBOX = 'omni.outbox';
  });

  it('processes inbound, publishes once to outbox, dispatches to MCP', async () => {
    const consumer = new InboundConsumer(redis as unknown as any, { retryMs: 0, pollMs: 0 });
    await consumer.init();
    const dispatcher = new Dispatcher(redis as unknown as any, { retryMs: 0, pollMs: 0 });
    await dispatcher.init();

    // Push inbound with fixed id so out id is deterministic (":out")
    const inbound = {
      id: 'e2e-1',
      channel: 'whatsapp',
      direction: 'in',
      conversationId: 'conv-1',
      from: { id: 'user:1' },
      to: { id: 'agent:bot' },
      timestamp: Date.now(),
      text: 'Olá',
    };
    await redis.xAdd('omni.messages', '*', { payload: JSON.stringify(inbound) });

    // First pass: inbound -> outbox publish (dedupe miss)
    await consumer.runOnce();
    expect(redis.streams.get('omni.outbox')?.messages.length || 0).toBe(1);

    // Second identical inbound: should dedupe and NOT publish again
    await redis.xAdd('omni.messages', '*', { payload: JSON.stringify(inbound) });
    await consumer.runOnce();
    expect(redis.streams.get('omni.outbox')?.messages.length || 0).toBe(1);

    // Dispatch once (should deliver to MCP and ack)
    const outboxBefore = redis.streams.get('omni.outbox');
    const firstId = outboxBefore?.messages[0]?.id as string;
    await dispatcher.runOnce();
    expect(redis.hashes.get(`status:${firstId}`)).toEqual({ status: 'sent' });
    expect(redis.streams.get('omni.outbox')?.pending.size).toBe(0);
  });
});

