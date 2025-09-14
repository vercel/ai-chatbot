import pino from 'pino';
import { redactForLog } from '@/lib/security/sanitize';

export const logger = pino({
  name: 'omni',
  level: process.env.LOG_LEVEL || 'info',
  redact: {
    paths: ['headers.authorization', 'authorization', '*.password', '*.token', '*.apiKey', '*.secret'],
    censor: '[REDACTED]'
  },
  serializers: {
    from(v: unknown) {
      try { return redactForLog(v); } catch { return v as any; }
    },
    to(v: unknown) {
      try { return redactForLog(v); } catch { return v as any; }
    },
    text(v: unknown) {
      try { return typeof v === 'string' ? (v.length > 48 ? v.slice(0, 48) + '…' : v) : v as any; } catch { return v as any; }
    },
    payload(v: unknown) {
      try { return redactForLog(v); } catch { return v as any; }
    },
  },
});

export default logger;
