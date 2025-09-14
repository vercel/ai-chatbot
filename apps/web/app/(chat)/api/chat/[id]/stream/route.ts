import { NextRequest } from 'next/server';
import { track } from '@/apps/web/lib/analytics/events.pix';
import { withModel } from '@/lib/load-balancing/load-balancer';

export const runtime = 'edge';

/** Select which backend to use: OPENAI > GATEWAY > MOCK */
function selectBackend() {
  if (process.env.OPENAI_API_KEY) return 'openai' as const;
  if (process.env.AI_GATEWAY_API_URL) return 'gateway' as const;
  return 'mock' as const;
}

/** Run a promise with a timeout that aborts using the provided controller */
async function withTimeout<T>(promise: Promise<T>, ms: number, controller: AbortController): Promise<T> {
  let tid: number | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    tid = setTimeout(() => {
      try { controller.abort(); } catch {}
      reject(new Error('timeout'));
    }, ms) as unknown as number;
  });
  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (tid) clearTimeout(tid);
  }
}

/** Pipe a source Response to an SSE stream with heartbeats */
function pipeSSE(source: Response, requestId: string, heartbeatMs: number): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream<Uint8Array>({
    async start(controller) {
      let hb: number | undefined;
      const send = (text: string) => controller.enqueue(encoder.encode(text));
      // Initial id for correlation
      send(`event: info\n` + `data: ${JSON.stringify({ requestId })}\n\n`);
      // Heartbeats
      hb = setInterval(() => {
        try { send(`event: ping\n` + `data: {"ts":${Date.now()}}\n\n`); } catch {}
      }, heartbeatMs) as unknown as number;
      try {
        if (!source.body) {
          send(`event: error\n` + `data: ${JSON.stringify({ message: 'empty body', requestId })}\n\n`);
          controller.close();
          return;
        }
        const reader = source.body.getReader();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (value) controller.enqueue(value);
        }
        controller.close();
      } catch (err) {
        send(`event: error\n` + `data: ${JSON.stringify({ message: humanizeError(err), requestId })}\n\n`);
        controller.close();
      } finally {
        if (hb) clearInterval(hb);
      }
    },
  });
}

/** Produce a minimal mock SSE stream for CI */
function mockSSE(requestId: string, heartbeatMs: number): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  const chunks = [
    'Olá! ', 'Sou um mock de streaming. ', 'Isto valida fallback e timeouts. ', '👍',
  ];
  return new ReadableStream<Uint8Array>({
    start(controller) {
      const send = (text: string) => controller.enqueue(encoder.encode(text));
      let i = 0;
      send(`event: info\n` + `data: ${JSON.stringify({ requestId, backend: 'mock' })}\n\n`);
      const hb = setInterval(() => send(`event: ping\n` + `data: {"ts":${Date.now()}}\n\n`), heartbeatMs) as unknown as number;
      const id = setInterval(() => {
        if (i >= chunks.length) {
          clearInterval(id);
          clearInterval(hb);
          send(`event: done\n` + `data: {"ok":true}\n\n`);
          controller.close();
          return;
        }
        send(`data: ${chunks[i]}\n\n`);
        i++;
      }, 50) as unknown as number;
    },
  });
}

function humanizeError(err: unknown): string {
  const msg = (err as Error)?.message || String(err);
  if (msg.includes('timeout')) return 'Tempo esgotado ao conectar ao provedor';
  if (msg.includes('fetch') || msg.includes('network')) return 'Falha de rede ao conectar ao provedor';
  return 'Erro inesperado ao gerar resposta';
}

/** Fetch OpenAI chat completions SSE (Edge-safe) */
async function fetchOpenAISSE(messages: unknown[], signal: AbortSignal): Promise<Response> {
  const apiKey = process.env.OPENAI_API_KEY!;
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
  return fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model, stream: true, messages }),
    signal,
  });
}

/** Fetch AI Gateway SSE: posts to AI_GATEWAY_API_URL and expects SSE body */
async function fetchGatewaySSE(messages: unknown[], signal: AbortSignal): Promise<Response> {
  const url = process.env.AI_GATEWAY_API_URL!; // e.g. http://localhost:7070/mock
  return fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ stream: true, messages }),
    signal,
  });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const reqId = req.headers.get('x-request-id') || crypto.randomUUID();
  const timeoutMs = Number(process.env.CHAT_STREAM_TIMEOUT_MS || 30000);
  const hbMs = Number(process.env.CHAT_HEARTBEAT_MS || 15000);
  let messages: unknown[] = [];
  try {
    messages = await req.json();
  } catch {
    // ignore, malformed
  }

  // analytics start
  try { track({ name: 'pix_activation_start', payload: { user_id: params.id, channel: 'web' } } as any); } catch {}

  const backend = selectBackend();
  let upstream: Response | undefined;

  // Log request start
  try { console.log('[chat-stream:start]', { requestId: reqId, backend, len: Array.isArray(messages) ? messages.length : 0 }); } catch {}

  try {
    const providers: string[] = backend === 'openai'
      ? ['openai', process.env.AI_GATEWAY_API_URL ? 'gateway' : '', 'mock'].filter(Boolean)
      : backend === 'gateway'
        ? ['gateway', 'mock']
        : ['mock'];
    upstream = await withModel(
      {
        modelType: 'chat',
        preferredProvider: backend as any,
        maxLatencyMs: timeoutMs,
        providers: providers as any,
        requestId: reqId,
      },
      async ({ provider, signal }) => {
        if (provider === 'openai') return fetchOpenAISSE(messages, signal);
        if (provider === 'gateway') return fetchGatewaySSE(messages, signal);
        // mock
        return new Response(mockSSE(reqId, hbMs), { headers: { 'content-type': 'text/event-stream; charset=utf-8' } });
      },
      { timeoutMs },
    );
  } catch (err) {
    // On total failure, fallback to mock SSE
    const body = mockSSE(reqId, hbMs);
    try { track({ name: 'pix_activation_success', payload: { user_id: params.id, value: 1 } } as any); } catch {}
    return new Response(body, { status: 200, headers: { 'content-type': 'text/event-stream; charset=utf-8', 'cache-control': 'no-cache, no-transform', connection: 'keep-alive', 'x-request-id': reqId } });
  }

  // If upstream acquired but not ok, still stream what we got; else map error event
  if (!upstream) {
    const msg = 'Falha ao selecionar backend';
    try { console.error('[chat-stream]', { requestId: reqId, error: msg }); } catch {}
    return new Response(`event: error\n` + `data: ${JSON.stringify({ message: msg, requestId: reqId })}\n\n`, {
      status: 502,
      headers: { 'content-type': 'text/event-stream; charset=utf-8', 'x-request-id': reqId },
    });
  }

  // Success: pipe upstream with heartbeats
  try { track({ name: 'pix_activation_success', payload: { user_id: params.id, value: 1 } } as any); } catch {}
  const body = pipeSSE(upstream, reqId, hbMs);
  try { console.log('[chat-stream:connected]', { requestId: reqId, backend, status: upstream.status }); } catch {}
  return new Response(body, {
    status: 200,
    headers: {
      'content-type': 'text/event-stream; charset=utf-8',
      'cache-control': 'no-cache, no-transform',
      connection: 'keep-alive',
      'x-request-id': reqId,
    },
  });
}
