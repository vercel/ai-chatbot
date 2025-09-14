import { describe, it, expect, beforeEach, vi } from 'vitest';
import { POST } from '@/apps/web/app/(chat)/api/chat/[id]/stream/route';

function textFromReadable(rs: ReadableStream<Uint8Array>): Promise<string> {
  const reader = rs.getReader();
  const dec = new TextDecoder();
  let acc = '';
  return new Promise((resolve, reject) => {
    function pump(): any {
      reader.read().then(({ done, value }) => {
        if (done) return resolve(acc);
        if (value) acc += dec.decode(value, { stream: true });
        return pump();
      }).catch(reject);
    }
    pump();
  });
}

describe('chat stream route fallbacks and timeouts', () => {
  beforeEach(() => {
    vi.resetModules();
    // Ensure OPENAI is not used
    delete (process as any).env.OPENAI_API_KEY;
    // Point gateway to an unreachable address to force fallback
    process.env.AI_GATEWAY_API_URL = 'http://127.0.0.1:1';
    // Speed up tests
    process.env.CHAT_STREAM_TIMEOUT_MS = '50';
    process.env.CHAT_HEARTBEAT_MS = '20';
  });

  it('falls back to mock and streams tokens with heartbeats', async () => {
    const req = new Request('http://localhost/chat', { method: 'POST', body: JSON.stringify([{ role: 'user', content: 'Oi' }]) });
    const res = await POST(req as any, { params: { id: 'user-1' } });
    expect(res.status).toBe(200);
    const body = res.body!;
    const text = await textFromReadable(body);
    expect(text).toContain('event: info');
    expect(text).toContain('event: ping');
    expect(text).toContain('data: Olá!');
    expect(res.headers.get('x-request-id')).toBeTruthy();
  });
});

