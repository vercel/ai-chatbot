import { NextRequest } from 'next/server';
import { nanoid } from 'nanoid';
import { createClient } from 'redis';
import { ZodError } from 'zod';
import { MessageCanonicalSchema, MessageCanonical, ok, error } from '../../../../lib/omni/http';
import { logger } from '../../../../lib/omni/log';

async function publishWithRetry(stream: string, message: MessageCanonical, log: any, retries = 1) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const client = createClient({ url: process.env.REDIS_URL });
    try {
      await client.connect();
      const id = await client.xAdd(stream, '*', { data: JSON.stringify(message) });
      await client.quit();
      return id;
    } catch (err) {
      log.error({ err, attempt: attempt + 1 }, 'redis_publish_error');
      try { await client.quit(); } catch {}
      if (attempt === retries) throw err;
    }
  }
}

export async function POST(req: NextRequest) {
  const trace_id = nanoid();
  const log = logger.child({ trace_id, route: 'omni.outbox' });
  let payload: MessageCanonical;

  try {
    payload = MessageCanonicalSchema.parse(await req.json());
  } catch (e) {
    if (e instanceof ZodError) {
      return error('invalid_payload', e.message, trace_id, 422);
    }
    return error('bad_request', 'Invalid request body', trace_id, 400);
  }

  if (payload.direction !== 'out') {
    return error('bad_request', 'direction must be "out"', trace_id, 400);
  }

  try {
    const id = await publishWithRetry('omni.outbox', payload, log);
    log.info({ id }, 'message_published');
    return ok({ id }, trace_id);
  } catch (err) {
    return error('redis_error', 'Failed to publish message', trace_id, 502);
  }
}
