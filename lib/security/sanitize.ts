export type JSONVal = string | number | boolean | null | JSONVal[] | { [k: string]: JSONVal };

const REMOVE_KEYS = new Set(['password', 'token', 'apiKey', 'authorization', 'secret']);
const OBFUSCATE_KEYS = new Set(['email']);

function maskEmail(v: string): string {
  const at = v.indexOf('@');
  if (at <= 1) return '***';
  const name = v.slice(0, at);
  const dom = v.slice(at + 1);
  const first = name[0];
  return `${first}${'*'.repeat(Math.max(1, name.length - 1))}@${dom}`;
}

function maskText(v: string): string {
  if (v.length <= 32) return v;
  return v.slice(0, 32) + '…';
}

export function sanitizePayload<T extends JSONVal>(obj: T): T {
  function walk(o: any): any {
    if (o === null || o === undefined) return o;
    if (Array.isArray(o)) return o.map(walk);
    if (typeof o !== 'object') return o;
    const out: any = {};
    for (const [k, v] of Object.entries(o)) {
      if (REMOVE_KEYS.has(k.toLowerCase())) continue;
      if (OBFUSCATE_KEYS.has(k.toLowerCase()) && typeof v === 'string') {
        out[k] = maskEmail(v);
        continue;
      }
      out[k] = walk(v);
    }
    return out;
  }
  return walk(obj);
}

export function redactForLog(obj: any): any {
  function walk(o: any): any {
    if (o === null || o === undefined) return o;
    if (Array.isArray(o)) return o.map(walk);
    if (typeof o !== 'object') return typeof o === 'string' ? maskText(o) : o;
    const out: any = {};
    for (const [k, v] of Object.entries(o)) {
      const lk = k.toLowerCase();
      if (REMOVE_KEYS.has(lk)) {
        out[k] = '[REDACTED]';
        continue;
      }
      if (lk === 'email' && typeof v === 'string') {
        out[k] = maskEmail(v);
        continue;
      }
      if ((lk === 'id' || lk === 'phone') && typeof v === 'string') {
        const tail = v.slice(-4);
        out[k] = `***${tail}`;
        continue;
      }
      if (lk === 'text' && typeof v === 'string') {
        out[k] = maskText(v);
        continue;
      }
      out[k] = walk(v);
    }
    return out;
  }
  return walk(obj);
}

