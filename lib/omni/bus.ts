import { createClient } from 'redis';
import { OmniBusError } from './errors';
import { incrementMessage, incrementError } from '@/lib/metrics/counters';

export interface PublishOpts {
  retries?: number;
  backoffMs?: number;
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
