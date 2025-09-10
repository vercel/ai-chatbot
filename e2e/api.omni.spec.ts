import { describe, expect, test, vi, afterEach } from 'vitest';
import supertest from 'supertest';
import type { NextApiHandler } from 'next';
import { NextRequest } from 'next/server';

vi.mock('redis', () => ({ createClient: vi.fn() }));

const baseMessage = {
  channel: 'whatsapp',
  to: '123',
  from: '456',
  content: 'hello',
};

afterEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
});

function toPagesHandler(mod: any): NextApiHandler {
  return async (req, res) => {
    const chunks: any[] = [];
    for await (const chunk of req) chunks.push(chunk);
    const body = Buffer.concat(chunks).toString();
    const request = new NextRequest('http://test', {
      method: req.method,
      headers: req.headers as any,
      body: body || undefined,
    });
    const response = await mod.POST(request as any);
    res.statusCode = response.status;
    response.headers.forEach((v, k) => res.setHeader(k, v));
    const text = await response.text();
    res.end(text);
  };
}

describe('omni api inbox', () => {
  test('publishes message', async () => {
    const xAdd = vi.fn().mockResolvedValue('1-0');
    const { createClient } = await import('redis');
    (createClient as unknown as vi.Mock).mockReturnValue({
      connect: vi.fn().mockResolvedValue(undefined),
      xAdd,
      quit: vi.fn().mockResolvedValue(undefined),
    });
    vi.mock('../lib/omni/log', () => ({
      logger: { child: () => ({ info: vi.fn(), error: vi.fn(), warn: vi.fn() }) },
    }));
    const mod = await import('../app/api/omni/inbox/route');
    const handler = toPagesHandler(mod);
    const res = await supertest(handler as any)
      .post('/')
      .send({ ...baseMessage, direction: 'in' });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(xAdd).toHaveBeenCalledWith('omni.messages', '*', expect.any(Object));
  });

  test('validates direction', async () => {
    const { createClient } = await import('redis');
    (createClient as unknown as vi.Mock).mockReturnValue({
      connect: vi.fn(),
      xAdd: vi.fn(),
      quit: vi.fn(),
    });
    const mod = await import('../app/api/omni/inbox/route');
    const handler = toPagesHandler(mod);
    const res = await supertest(handler as any)
      .post('/')
      .send({ ...baseMessage, direction: 'out' });
    expect(res.status).toBe(400);
    expect(res.body.ok).toBe(false);
  });

  test('fails on invalid body', async () => {
    const { createClient } = await import('redis');
    (createClient as unknown as vi.Mock).mockReturnValue({
      connect: vi.fn(),
      xAdd: vi.fn(),
      quit: vi.fn(),
    });
    const mod = await import('../app/api/omni/inbox/route');
    const handler = toPagesHandler(mod);
    const res = await supertest(handler as any)
      .post('/')
      .send({ direction: 'in' });
    expect(res.status).toBe(422);
    expect(res.body.ok).toBe(false);
  });

  test('returns 502 when redis fails', async () => {
    const xAdd = vi.fn().mockRejectedValue(new Error('fail'));
    const { createClient } = await import('redis');
    (createClient as unknown as vi.Mock).mockReturnValue({
      connect: vi.fn().mockResolvedValue(undefined),
      xAdd,
      quit: vi.fn().mockResolvedValue(undefined),
    });
    const errorSpy = vi.fn();
    vi.mock('../lib/omni/log', () => ({
      logger: { child: () => ({ info: vi.fn(), error: errorSpy, warn: vi.fn() }) },
    }));
    const mod = await import('../app/api/omni/inbox/route');
    const handler = toPagesHandler(mod);
    const res = await supertest(handler as any)
      .post('/')
      .send({ ...baseMessage, direction: 'in' });
    expect(res.status).toBe(502);
    expect(res.body.ok).toBe(false);
    expect(xAdd).toHaveBeenCalledTimes(2);
  });
});

describe('omni api outbox', () => {
  test('publishes message', async () => {
    const xAdd = vi.fn().mockResolvedValue('1-0');
    const { createClient } = await import('redis');
    (createClient as unknown as vi.Mock).mockReturnValue({
      connect: vi.fn().mockResolvedValue(undefined),
      xAdd,
      quit: vi.fn().mockResolvedValue(undefined),
    });
    vi.mock('../lib/omni/log', () => ({
      logger: { child: () => ({ info: vi.fn(), error: vi.fn(), warn: vi.fn() }) },
    }));
    const mod = await import('../app/api/omni/outbox/route');
    const handler = toPagesHandler(mod);
    const res = await supertest(handler as any)
      .post('/')
      .send({ ...baseMessage, direction: 'out' });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(xAdd).toHaveBeenCalledWith('omni.outbox', '*', expect.any(Object));
  });
});
