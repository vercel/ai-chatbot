type Sample = number;

interface Stats { count: number; min: number; max: number; avg: number; p50: number; p90: number; p99: number }

const MAX_SAMPLES = 5000;
const store = new Map<string, Sample[]>();

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

export function recordDuration(name: string, ms: number) {
  const arr = store.get(name) ?? [];
  arr.push(ms);
  if (arr.length > MAX_SAMPLES) arr.splice(0, arr.length - MAX_SAMPLES);
  store.set(name, arr);
}

export function getHist(name: string): Stats {
  return compute(store.get(name) ?? []);
}

export function getAllHists(): Record<string, Stats> {
  const obj: Record<string, Stats> = {};
  for (const [k, v] of store.entries()) obj[k] = compute(v);
  return obj;
}

