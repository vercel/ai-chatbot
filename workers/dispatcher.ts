import { randomUUID } from "node:crypto";
import { dispatch, type OutboxMessage } from "../lib/omni/dispatch";
import { incrementError, incrementMessage } from "@/lib/metrics/counters";
import { logger } from "@/lib/omni/log";
import { recordDuration, recordDurationL } from "@/lib/metrics/hist";
import { incrementCounter } from "@/lib/monitoring/metrics";

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

export interface DispatcherOpts {
  stream?: string;
  group?: string;
  consumer?: string;
  dlqStream?: string;
  pollMs?: number;
  retryMs?: number;
}

export class Dispatcher {
  private stream: string;
  private group: string;
  private consumer: string;
  private dlq: string;
  private pollMs: number;
  private retryMs: number;

  constructor(private client: RedisLike, opts: DispatcherOpts = {}) {
    this.stream = opts.stream ?? "omni.outbox";
    this.group = opts.group ?? "dispatcher";
    this.consumer = opts.consumer ?? `disp-${randomUUID()}`;
    this.dlq = opts.dlqStream ?? process.env.OMNI_DLQ_STREAM ?? "omni.dlq";
    this.pollMs = opts.pollMs ?? Number(process.env.OMNI_DISPATCH_POLL_MS ?? 250);
    this.retryMs = opts.retryMs ?? 5000;
  }

  async init() {
    try {
      await this.client.xGroupCreate(this.stream, this.group, "0", { MKSTREAM: true });
      // biome-ignore lint/suspicious/noExplicitAny: redis client error type
    } catch (err: any) {
      if (!err?.message?.includes("BUSYGROUP")) throw err;
    }
  }

  private async processMessage(msg: { id: string; message: Record<string, string> }) {
    const started = Date.now();
    const fields = msg.message;
    let payload: unknown;
    try {
      payload = JSON.parse(fields.payload);
    } catch (err) {
      await this.client.xAdd(this.dlq, "*", fields);
      await this.client.xAck(this.stream, this.group, msg.id);
      await this.client.hSet(`status:${msg.id}`, { status: "failed" });
      logger.error({ err }, "dispatcher_malformed");
      incrementError();
      return;
    }

    try {
      await dispatch(payload as OutboxMessage);
      await this.client.xAck(this.stream, this.group, msg.id);
      await this.client.hSet(`status:${msg.id}`, { status: "sent" });
      const dur = Date.now() - started;
      incrementMessage();
      recordDuration('dispatch_ms', dur);
      try {
        const ch = (payload as any)?.channel || (payload as any)?.to?.kind || 'unknown';
        recordDurationL('dispatch_ms', { channel: String(ch) }, dur);
        try { incrementCounter('dispatcher_total', { channel: String(ch) }); } catch {}
      } catch {}
      logger.info({ id: msg.id, duration_ms: dur }, "dispatcher_sent");
    } catch (err) {
      await this.client.hSet(`status:${msg.id}`, { status: "failed" });
      logger.error({ err }, "dispatch_error");
      incrementError();
    }
  }

  async runOnce() {
    const [, claimed] = await this.client.xAutoClaim(
      this.stream,
      this.group,
      this.consumer,
      this.retryMs,
      "0-0",
    );
    for (const msg of claimed) await this.processMessage(msg);

    const res = await this.client.xReadGroup(this.group, this.consumer, [{ key: this.stream, id: ">" }], { COUNT: 1, BLOCK: this.pollMs });
    if (!res) return;
    for (const stream of res) {
      for (const msg of stream.messages) {
        await this.processMessage(msg);
      }
    }
  }
}

