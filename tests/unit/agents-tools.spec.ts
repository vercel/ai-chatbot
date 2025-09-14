import { describe, it, expect, vi, beforeEach } from 'vitest';
import { send_message } from '@/agents/tools/send_message';

vi.mock('@/lib/omni/bus', () => ({
  publishWithRetry: vi.fn(async () => '9-0'),
}));

describe('agents/tools/send_message', () => {
  beforeEach(() => vi.clearAllMocks());

  it('publishes with params and returns id/channel/text', async () => {
    const res = await send_message({ channel: 'web', to: { id: 'user:1' }, text: 'hi' });
    expect(res.id).toBeTruthy();
    expect(res.channel).toBe('web');
    expect(res.text).toBe('hi');
  });

  it('compat legacy without to', async () => {
    const res = await send_message({ channel: 'web', text: 'legacy' } as any);
    expect(res.text).toBe('legacy');
  });
});

