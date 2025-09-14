import { describe, it, expect } from 'vitest';
import { withModel } from '@/lib/load-balancing/load-balancer';

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

describe('load balancer policies and fallback', () => {
  it('falls back on timeout to secondary provider', async () => {
    const res = await withModel(
      { modelType: 'chat', providers: ['openai', 'anthropic'], maxLatencyMs: 20 },
      async ({ provider, signal }) => {
        if (provider === 'openai') {
          await delay(50);
          return 'late' as any;
        }
        if (signal.aborted) throw new Error('aborted');
        return 'ok-anthropic' as any;
      },
      { timeoutMs: 20 },
    );
    expect(res).toBe('ok-anthropic');
  });

  it('falls back on 429 error', async () => {
    const res = await withModel(
      { modelType: 'chat', providers: ['openai', 'anthropic'] },
      async ({ provider }) => {
        if (provider === 'openai') {
          const err = Object.assign(new Error('rate limited'), { code: 429 });
          throw err;
        }
        return 'ok-anthropic' as any;
      },
      { timeoutMs: 1000 },
    );
    expect(res).toBe('ok-anthropic');
  });

  it('enforces maxCost and falls back when cost is high', async () => {
    const res = await withModel(
      { modelType: 'chat', providers: ['openai', 'anthropic'], maxCost: 1.0 },
      async ({ provider }) => {
        return { provider } as any;
      },
      {
        timeoutMs: 100,
        costEstimator: (r: any) => (r.provider === 'openai' ? 2.0 : 0.5),
      },
    );
    expect((res as any).provider).toBe('anthropic');
  });
});

