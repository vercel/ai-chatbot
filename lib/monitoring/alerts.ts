import { stableLabelKey } from '@/lib/metrics/hist';

type Labels = Record<string, string>;

interface Sample { t: number; ms: number }

const WINDOW_MS = 5 * 60 * 1000; // 5 minutes
const store = new Map<string, Sample[]>(); // labelKey -> samples
let started = false;

export function recordAiLatency(labels: Labels, ms: number): void {
  try {
    const key = stableLabelKey(labels);
    const arr = store.get(key) ?? [];
    arr.push({ t: Date.now(), ms });
    // Trim older than window, keep up to 5000 samples per key
    const cutoff = Date.now() - WINDOW_MS;
    const trimmed = arr.filter((s) => s.t >= cutoff).slice(-5000);
    store.set(key, trimmed);
  } catch {}
}

function p95(samples: number[]): number {
  if (samples.length === 0) return 0;
  const sorted = [...samples].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.floor(0.95 * sorted.length));
  return sorted[idx];
}

export function startLatencyMonitor(): void {
  if (started) return; // idempotent
  started = true;
  const target = Number(process.env.AI_P95_TARGET_MS || 2000);
  const tick = () => {
    const now = Date.now();
    const cutoff = now - WINDOW_MS;
    for (const [lk, arr] of store.entries()) {
      const win = arr.filter((s) => s.t >= cutoff).map((s) => s.ms);
      if (win.length < 5) continue; // need some volume
      const val = p95(win);
      if (val > target) {
        try {
          console.warn('[alert] ai_latency_ms_p95_breach', { labelKey: lk, p95_ms: val, target_ms: target, window_ms: WINDOW_MS });
        } catch {}
      }
    }
  };
  // Check once per minute
  setInterval(tick, 60_000);
}

