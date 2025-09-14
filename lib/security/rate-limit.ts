import { createClient, type RedisClientType } from 'redis';

type Bucket = { tokens: number; updatedAt: number };

const memoryBuckets = new Map<string, Bucket>();
let redisClient: RedisClientType | null = null;

function cfg() {
  const rps = Number.parseInt(process.env.RATE_LIMIT_RPS || '5', 10);
  const burst = Number.parseInt(process.env.RATE_LIMIT_BURST || '10', 10);
  return { rps: Math.max(1, rps), burst: Math.max(1, burst) };
}

async function getRedis(): Promise<RedisClientType | null> {
  const url = process.env.REDIS_URL;
  if (!url) return null;
  if (process.env.NEXT_RUNTIME === 'edge') return null;
  if (redisClient) return redisClient;
  const client = createClient({ url });
  try {
    await client.connect();
    redisClient = client as RedisClientType;
    return redisClient;
  } catch {
    try { await client.quit(); } catch {}
    return null;
  }
}

function refill(bucket: Bucket, now: number, ratePerMs: number, capacity: number) {
  const elapsed = Math.max(0, now - bucket.updatedAt);
  const refillTokens = elapsed * ratePerMs;
  const tokens = Math.min(capacity, bucket.tokens + refillTokens);
  return { tokens, updatedAt: now } as Bucket;
}

/**
 * Check a token bucket for a key; decrements cost if allowed.
 * Returns ok, remaining and retryAfter seconds.
 */
export async function checkRateLimit(key: string, cost = 1): Promise<{ ok: boolean; remaining: number; retryAfterSec: number }>{
  const { rps, burst } = cfg();
  const ratePerMs = rps / 1000;
  const now = Date.now();

  // Try Redis-backed bucket first
  const client = await getRedis();
  if (client) {
    // Use a simple Lua script to atomically refill and consume
    // KEYS[1]=bucket_key, ARGV[1]=now, ARGV[2]=ratePerMs, ARGV[3]=capacity, ARGV[4]=cost
    const script = `
      local bkey = KEYS[1]
      local now = tonumber(ARGV[1])
      local rate = tonumber(ARGV[2])
      local cap = tonumber(ARGV[3])
      local cost = tonumber(ARGV[4])
      local data = redis.call('HMGET', bkey, 'tokens', 'updatedAt')
      local tokens = tonumber(data[1]) or cap
      local updatedAt = tonumber(data[2]) or now
      local elapsed = math.max(0, now - updatedAt)
      tokens = math.min(cap, tokens + elapsed * rate)
      local ok = 0
      if tokens >= cost then
        tokens = tokens - cost
        ok = 1
      end
      redis.call('HMSET', bkey, 'tokens', tokens, 'updatedAt', now)
      redis.call('PEXPIRE', bkey, 600000)
      local remaining = math.floor(tokens)
      local needed = 0
      if ok == 0 then
        needed = cost - tokens
      end
      local retryAfterMs = math.ceil(needed / rate)
      return { ok, remaining, retryAfterMs }
    `;
    try {
      // @ts-ignore
      const [okFlag, remaining, retryAfterMs] = (await (client as any).eval(script, {
        keys: [`rl:${key}`],
        arguments: [String(now), String(ratePerMs), String(burst), String(cost)],
      })) as [number, number, number];
      const ok = okFlag === 1;
      return { ok, remaining, retryAfterSec: Math.ceil((retryAfterMs || 0) / 1000) };
    } catch {
      // fall through to memory
    }
  }

  // In-memory fallback
  const b = memoryBuckets.get(key) || { tokens: burst, updatedAt: now };
  const refilled = refill(b, now, ratePerMs, burst);
  let ok = false;
  let tokens = refilled.tokens;
  if (tokens >= cost) {
    tokens -= cost;
    ok = true;
  }
  memoryBuckets.set(key, { tokens, updatedAt: now });
  const needed = ok ? 0 : cost - tokens;
  const retryAfterSec = needed > 0 ? Math.ceil(needed / rps) : 0;
  return { ok, remaining: Math.floor(tokens), retryAfterSec };
}

export function keyFromParts(parts: Array<string | undefined | null>): string {
  return parts.filter(Boolean).join('|');
}

