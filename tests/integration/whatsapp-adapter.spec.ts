import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import http from 'node:http';
import app from '@/scripts/mcp-sim';
import { sendWhatsApp } from '@/adapters/whatsapp/sender';

let server: http.Server;
let baseURL: string;

describe('WhatsApp adapter with MCP simulator', () => {
  beforeAll(async () => {
    server = app.listen(0);
    await new Promise((r) => server.once('listening', r));
    const addr = server.address();
    const port = typeof addr === 'object' && addr ? addr.port : 0;
    baseURL = `http://127.0.0.1:${port}`;
    process.env.MCP_WHATSAPP_URL = baseURL;
    process.env.MCP_TOKEN = 'dev-token';
  });

  afterAll(async () => {
    await new Promise((r) => server.close(() => r(null)));
  });

  it('sends message successfully and is idempotent', async () => {
    const msg = {
      id: 'idemp-1',
      channel: 'whatsapp' as const,
      direction: 'out' as const,
      conversationId: 'conv-x',
      from: { id: 'agent:bot' },
      to: { id: 'wa:+551199999', phone: '+551199999' },
      timestamp: Date.now(),
      text: 'Olá',
    };
    const r1 = await sendWhatsApp(msg as any);
    expect(r1.status).toBe('sent');
    const r2 = await sendWhatsApp(msg as any);
    expect(r2.status).toBe('sent');
  });
});

