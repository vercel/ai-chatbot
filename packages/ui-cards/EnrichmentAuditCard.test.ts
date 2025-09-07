import { describe, expect, it } from 'vitest';
import { summarizeEnrichment, type EnrichmentEvent } from './EnrichmentAuditCard';

describe('summarizeEnrichment', () => {
  it('aggregates sources and metrics', () => {
    const events: EnrichmentEvent[] = [
      { source: 's1', latency_ms: 120, cache_hit: true, fallback_used: false },
      { source: 's2', latency_ms: 80, cache_hit: false, fallback_used: true },
      { source: 's1', latency_ms: 40, cache_hit: true, fallback_used: false },
    ];
    const summary = summarizeEnrichment(events, 50);
    expect(summary.sources).toEqual(['s1', 's2']);
    expect(summary.cache_hits).toBe(2);
    expect(summary.fallbacks_used).toBe(1);
    expect(summary.histogram.slice(0, 3)).toEqual([1, 1, 1]);
  });
});
