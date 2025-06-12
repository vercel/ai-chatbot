/**
 * @file lib/redis.ts
 * @description Helper to execute actions with a Redis client.
 * @version 1.0.0
 * @date 2025-06-12
 * @updated Initial version.
 */

/** HISTORY:
 * v1.0.0 (2025-06-12): Initial version with withRedis helper.
 */

import 'server-only'
import { createClient } from 'redis'

export async function withRedis<T> (
  fn: (client: ReturnType<typeof createClient>) => Promise<T>,
) {
  const client = createClient({ url: process.env.REDIS_URL })
  await client.connect()
  try {
    return await fn(client)
  } finally {
    await client.disconnect()
  }
}

// END OF: lib/redis.ts
