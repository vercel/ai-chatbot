import { createClient } from 'redis';
import { OmniBusError } from './errors';
import { incrementMessage, incrementError } from '@/lib/metrics/counters';
import { incrementCounter } from '@/lib/monitoring/metrics';

export interface PublishOpts {
  retries?: number;
  backoffMs?: number;
}

export interface ReadOpts {
  count?: number;
  blockMs?: number;
}

export interface RedisLike {
  xReadGroup: (
    group: string,
    consumer: string,
    keys: Array<{ key: string; id: string }>,
    opts: unknown,
  ) => Promise<
    | null
    | Array<{ name: string; messages: Array<{ id: string; message: Record<string, string> }> }>
  >;
  xAck: (stream: string, group: string, id: string) => Promise<unknown>;
}

/**
 * Publish a payload to a Redis Stream with basic retry/backoff.
 * Serializes as { data: JSON.stringify(payload) } to keep historical compatibility.
 */
export async function publishWithRetry(
  stream: string,
  payload: unknown,
  opts: PublishOpts = {},
): Promise<string> {
  const retries = opts.retries ?? 1;
  const backoffMs = opts.backoffMs ?? 200;
  let lastErr: unknown;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const client = createClient({ url: process.env.REDIS_URL });
    try {
      await client.connect();
      const id = (await client.xAdd(stream, '*', {
        payload: JSON.stringify(payload),
      })) as string;
      await client.quit();
      try { incrementMessage(); } catch {}
      try {
        const ch = (payload as Record<string, unknown> | null) && typeof payload === 'object'
          ? (payload as Record<string, unknown>)['channel']
          : undefined;
        if (typeof ch === 'string' && ch) incrementCounter('outbound_total', { channel: ch });
      } catch {}
      return id;
    } catch (err) {
      try { incrementError(); } catch {}
      lastErr = err;
      try {
        await client.quit();
      } catch {
        // no-op
      }
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, backoffMs));
        continue;
      }
    }
  }
  throw new OmniBusError('redis_publish_error', lastErr);
}

/** Read once from a stream using a consumer group */
export async function readStream(
  client: RedisLike,
  stream: string,
  group: string,
  consumer: string,
  opts: ReadOpts = {},
) {
  const COUNT = opts.count ?? 1;
  const BLOCK = opts.blockMs ?? Number(process.env.OMNI_BLOCK_MS || 5000);
  return client.xReadGroup(group, consumer, [{ key: stream, id: '>' }], { COUNT, BLOCK });
}

/** Ack a message id on a stream */
export async function ack(client: RedisLike, stream: string, group: string, id: string) {
  return client.xAck(stream, group, id);
}
