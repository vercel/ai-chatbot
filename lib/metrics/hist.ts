type Sample = number;

interface Stats { count: number; min: number; max: number; avg: number; p50: number; p90: number; p99: number }

/** Maximum number of samples kept per metric-label set in-memory */
const MAX_SAMPLES = 5000;

let otel: undefined | ((name: string, ms: number, labels?: Record<string, string>) => void);
try {
  // Lazy require to avoid import cycles if OTel not configured
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const mod = require('@/lib/metrics/otel');
  // Maintain backward compatibility if otelRecordHistogram doesn't accept labels
  otel = ((name: string, ms: number, _labels?: Record<string, string>) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
      mod?.otelRecordHistogram?.(name, ms);
    } catch {}
  }) as typeof otel;
} catch {}

// Unlabelled samples store
const store = new Map<string, Sample[]>();

// Labelled samples store: metric -> labelKey -> samples[]
const lstore = new Map<string, Map<string, Sample[]>>();

function compute(samples: Sample[]): Stats {
  if (samples.length === 0) return { count: 0, min: 0, max: 0, avg: 0, p50: 0, p90: 0, p99: 0 };
  const sorted = [...samples].sort((a, b) => a - b);
  const n = sorted.length;
  const min = sorted[0];
  const max = sorted[n - 1];
  const sum = sorted.reduce((acc, v) => acc + v, 0);
  const pct = (p: number) => sorted[Math.min(n - 1, Math.floor((p / 100) * n))];
  return { count: n, min, max, avg: sum / n, p50: pct(50), p90: pct(90), p99: pct(99) };
}

/** Record an unlabelled duration sample (ms) */
export function recordDuration(name: string, ms: number) {
  const arr = store.get(name) ?? [];
  arr.push(ms);
  if (arr.length > MAX_SAMPLES) arr.splice(0, arr.length - MAX_SAMPLES);
  store.set(name, arr);
  try { otel?.(name, ms); } catch {}
}

/** Record a labelled duration sample (ms), e.g. labels: { channel: 'whatsapp' } */
export function recordDurationL(name: string, labels: Record<string, string>, ms: number) {
  const key = stableLabelKey(labels);
  let byLabel = lstore.get(name);
  if (!byLabel) {
    byLabel = new Map<string, Sample[]>();
    lstore.set(name, byLabel);
  }
  const arr = byLabel.get(key) ?? [];
  arr.push(ms);
  if (arr.length > MAX_SAMPLES) arr.splice(0, arr.length - MAX_SAMPLES);
  byLabel.set(key, arr);
  try { otel?.(name, ms, labels); } catch {}
}

export function getHist(name: string): Stats {
  return compute(store.get(name) ?? []);
}

export function getAllHists(): Record<string, Stats> {
  const obj: Record<string, Stats> = {};
  for (const [k, v] of store.entries()) obj[k] = compute(v);
  return obj;
}

export function getSamples(name: string): number[] {
  const arr = store.get(name) ?? [];
  return arr.slice();
}

/** Return map of labelKey -> samples for a metric */
export function getLabelledSamples(name: string): Record<string, number[]> {
  const byLabel = lstore.get(name);
  if (!byLabel) return {};
  const out: Record<string, number[]> = {};
  for (const [k, v] of byLabel.entries()) out[k] = v.slice();
  return out;
}

/** Return all labelled metrics as nested maps for snapshotting */
export function getAllLabelledSamples(): Record<string, Record<string, number[]>> {
  const out: Record<string, Record<string, number[]>> = {};
  for (const [metric, byLabel] of lstore.entries()) {
    out[metric] = {};
    for (const [lk, samples] of byLabel.entries()) out[metric][lk] = samples.slice();
  }
  return out;
}

/** Deterministic label key (sorted k=v joined by comma) */
export function stableLabelKey(labels: Record<string, string>): string {
  const parts = Object.keys(labels)
    .sort()
    .map((k) => `${k}=${labels[k]}`);
  return parts.join(',');
}
