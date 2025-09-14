import { describe, it, expect } from 'vitest';
import { recordDuration, getHist } from '@/lib/metrics/hist';

describe('bus monitoring histograms', () => {
  it('computes percentiles', () => {
    for (let i = 1; i <= 100; i++) recordDuration('inbound_ms', i);
    const h = getHist('inbound_ms');
    expect(h.count).toBeGreaterThan(0);
    expect(h.p50).toBeGreaterThan(0);
    expect(h.p90).toBeGreaterThan(0);
    expect(h.p99).toBeGreaterThan(0);
  });
});

