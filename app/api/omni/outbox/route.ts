import { NextRequest } from 'next/server';
import { nanoid } from 'nanoid';
import { coerceOutbound } from '@/lib/omni/schema';
import { ok, error } from '@/lib/omni/http';
import { logger } from '@/lib/omni/log';
import { publishWithRetry } from '@/lib/omni/bus';
import { OmniValidationError } from '@/lib/omni/errors';
import { checkRateLimit, keyFromParts } from '@/lib/security/rate-limit';
import { sanitizePayload } from '@/lib/security/sanitize';

export async function POST(req: NextRequest) {
  const trace_id = nanoid();
  const log = logger.child({ trace_id, route: 'omni.outbox' });

  try {
    const body = await req.json();
    const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0]?.trim() || 'unknown';
    const rl = await checkRateLimit(keyFromParts(['omni-outbox', ip]), 1);
    if (!rl.ok) return error('rate_limited', `retry in ${rl.retryAfterSec}s`, trace_id, 429);
    const env = coerceOutbound(sanitizePayload(body));
    const id = await publishWithRetry(process.env.OMNI_STREAM_OUTBOX || 'omni.outbox', env.message);
    log.info({ id }, 'message_outbound_published');
    return ok({ id }, trace_id);
  } catch (e) {
    if (e instanceof OmniValidationError) {
      return error('invalid_payload', e.message, trace_id, 422);
    }
    log.error({ err: e }, 'outbox_error');
    return error('redis_error', 'Failed to publish message', trace_id, 502);
  }
}
