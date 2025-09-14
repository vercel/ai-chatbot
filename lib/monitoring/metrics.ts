/**
 * Monitoring metrics abstraction: counters + histograms with optional Prom/OTel export.
 * - incrementCounter(name, labels)
 * - observeHistogram(name, value, labels)
 * - get snapshots for performance API (counters + p95 by label)
 */
import { recordDurationL, getAllLabelledSamples, stableLabelKey } from '@/lib/metrics/hist';

export type Labels = Record<string, string>;

// In-memory labelled counters: metric -> labelKey -> value
const counters = new Map<string, Map<string, number>>();

function getLabelKey(labels: Labels | undefined): string {
  return labels ? stableLabelKey(labels) : '';
}

export function incrementCounter(name: string, labels?: Labels, value = 1): void {
  let byLabel = counters.get(name);
  if (!byLabel) {
    byLabel = new Map<string, number>();
    counters.set(name, byLabel);
  }
  const key = getLabelKey(labels);
  const prev = byLabel.get(key) ?? 0;
  byLabel.set(key, prev + value);
}

export function observeHistogram(name: string, valMs: number, labels?: Labels): void {
  recordDurationL(name, labels ?? {}, valMs);
}

export function getAllCounters(): Record<string, Record<string, number>> {
  const out: Record<string, Record<string, number>> = {};
  for (const [metric, byLabel] of counters.entries()) {
    out[metric] = {};
    for (const [labelKey, v] of byLabel.entries()) out[metric][labelKey] = v;
  }
  return out;
}

function parseLabelKey(key: string): Record<string, string> {
  const out: Record<string, string> = {};
  if (!key) return out;
  for (const part of key.split(',')) {
    if (!part) continue;
    const [k, ...rest] = part.split('=');
    out[k] = rest.join('=');
  }
  return out;
}

function p95From(samples: number[]): number {
  if (samples.length === 0) return 0;
  const sorted = [...samples].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.floor(0.95 * sorted.length));
  return sorted[idx];
}

export function getP95Snapshot(): Record<string, Record<string, number>> {
  const labelled = getAllLabelledSamples();
  const out: Record<string, Record<string, number>> = {};
  for (const [metric, byLabel] of Object.entries(labelled)) {
    out[metric] = {};
    for (const [lk, samples] of Object.entries(byLabel)) {
      out[metric][lk] = p95From(samples);
    }
  }
  return out;
}

export function promEnabled(): boolean {
  const v = (process.env.PROMETHEUS_ENABLED || '').toLowerCase();
  return v === 'true' || v === 'on' || v === '1';
}

// Testing helpers
export function __resetMetricsForTest(): void {
  counters.clear();
}

