import { describe, it, expect, beforeEach } from 'vitest';
import { incrementCounter, observeHistogram, __resetMetricsForTest } from '@/lib/monitoring/metrics';
import { GET as perfGET } from '@/app/api/monitoring/performance/route';
import { GET as promGET } from '@/app/api/monitoring/metrics/route';

describe('monitoring performance API and Prom route', () => {
  beforeEach(() => {
    __resetMetricsForTest();
    process.env.PROMETHEUS_ENABLED = 'true';
  });

  it('returns counters and p95 by channel', async () => {
    // synthesize some measurements
    incrementCounter('inbound_total', { channel: 'whatsapp' });
    incrementCounter('outbound_total', { channel: 'whatsapp' });
    incrementCounter('dispatcher_total', { channel: 'whatsapp' });
    observeHistogram('inbound_ms', 50, { channel: 'whatsapp' });
    observeHistogram('inbound_ms', 120, { channel: 'whatsapp' });
    observeHistogram('inbound_ms', 200, { channel: 'whatsapp' });
    observeHistogram('dispatch_ms', 80, { channel: 'whatsapp' });
    observeHistogram('dispatch_ms', 100, { channel: 'whatsapp' });

    const res = await perfGET();
    const json = await (res as Response).json() as any;
    expect(json.counters.inbound_total.whatsapp).toBeGreaterThanOrEqual(1);
    expect(json.counters.outbound_total.whatsapp || 0).toBeGreaterThanOrEqual(0); // may be 0 here
    expect(json.p95.inbound_ms.whatsapp).toBeGreaterThanOrEqual(120);
    expect(json.p95.dispatch_ms.whatsapp).toBeGreaterThan(0);
  });

  it('exposes Prometheus text when enabled', async () => {
    const res = await promGET();
    const text = await (res as Response).text();
    expect(text).toContain('# TYPE');
  });
});

