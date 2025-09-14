import { randomUUID } from 'node:crypto';
import { coerceInbound, coerceOutbound } from '@/lib/omni/schema';
import { incrementError, incrementMessage } from '@/lib/metrics/counters';
import { publishWithRetry } from '@/lib/omni/bus';
import { logger } from '@/lib/omni/log';
import { recordDuration, recordDurationL } from '@/lib/metrics/hist';
import { send_message } from '@/agents/tools/send_message';

interface RedisLike {
  xGroupCreate: (
    stream: string,
    group: string,
    id: string,
    opts: unknown,
  ) => Promise<unknown>;
  xReadGroup: (
    group: string,
    consumer: string,
    keys: Array<{ key: string; id: string }>,
    opts: unknown,
  ) => Promise<
    | null
    | Array<{ name: string; messages: Array<{ id: string; message: Record<string, string> }> }>
  >;
  xAutoClaim: (
    stream: string,
    group: string,
    consumer: string,
    minIdle: number,
    start: string,
  ) => Promise<[string, Array<{ id: string; message: Record<string, string> }>] >;
  xAck: (stream: string, group: string, id: string) => Promise<unknown>;
  xAdd: (stream: string, id: string, message: Record<string, string>) => Promise<unknown>;
  hSet: (key: string, obj: Record<string, string>) => Promise<unknown>;
}

export interface InboundConsumerOpts {
  stream?: string;
  group?: string;
  consumer?: string;
  outboxStream?: string;
  pollMs?: number;
  retryMs?: number;
}

export class InboundConsumer {
  private stream: string;
  private group: string;
  private consumer: string;
  private outbox: string;
  private pollMs: number;
  private retryMs: number;

  constructor(private client: RedisLike, opts: InboundConsumerOpts = {}) {
    this.stream = opts.stream ?? (process.env.OMNI_STREAM_MESSAGES || 'omni.messages');
    this.group = opts.group ?? 'router';
    this.consumer = opts.consumer ?? `router-${randomUUID()}`;
    this.outbox = opts.outboxStream ?? (process.env.OMNI_STREAM_OUTBOX || 'omni.outbox');
    this.pollMs = opts.pollMs ?? Number(process.env.OMNI_DISPATCH_POLL_MS ?? 250);
    this.retryMs = opts.retryMs ?? 5000;
  }

  async init() {
    try {
      await this.client.xGroupCreate(this.stream, this.group, '0', { MKSTREAM: true });
      // biome-ignore lint/suspicious/noExplicitAny: redis client error type
    } catch (err: any) {
      if (!err?.message?.includes('BUSYGROUP')) throw err;
    }
  }

  private async processMessage(msg: { id: string; message: Record<string, string> }) {
    const start = Date.now();
    const fields = msg.message;
    let payload: unknown;
    try {
      const raw = fields.payload || fields.data; // tolerate both
      payload = JSON.parse(raw);
    } catch (err) {
      await this.client.hSet(`status:${msg.id}`, { status: 'malformed' });
      await this.client.xAck(this.stream, this.group, msg.id);
      incrementError();
      return;
    }

    // Normalize inbound
    const inbound = coerceInbound({ message: payload });

    // Route via agents/router.ts
    const { handleIncoming } = await import('@/agents/router');
    const outs = await handleIncoming(inbound);

    // Publish all outbounds via send_message (centraliza dedupe/idempotência)
    let lastId: string | undefined;
    for (const o of outs) {
      const res = await send_message(o as any);
      lastId = res.id;
    }
    logger.info({ id: lastId, count: outs.length, conv: inbound.message.conversationId, channel: inbound.message.channel }, 'inbound_processed');
    await this.client.hSet(`status:${msg.id}`, { status: 'processed' });
    await this.client.xAck(this.stream, this.group, msg.id);
    incrementMessage();
    const dur = Date.now() - start;
    recordDuration('inbound_ms', dur);
    try {
      const ch = inbound.message.channel || 'unknown';
      recordDurationL('inbound_ms', { channel: ch }, dur);
    } catch {}
    logger.debug({ duration_ms: dur }, 'inbound_duration');
  }

  async runOnce() {
    const [, claimed] = await this.client.xAutoClaim(
      this.stream,
      this.group,
      this.consumer,
      this.retryMs,
      '0-0',
    );
    for (const msg of claimed) await this.processMessage(msg);

    const res = await this.client.xReadGroup(this.group, this.consumer, [{ key: this.stream, id: '>' }], { COUNT: 1, BLOCK: this.pollMs });
    if (!res) return;
    for (const stream of res) {
      for (const msg of stream.messages) {
        await this.processMessage(msg);
      }
    }
  }
}
