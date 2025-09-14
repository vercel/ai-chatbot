/**
 * Minimal Prometheus exposition text snapshot.
 * - Exposes recent counters (last hour/5min) as gauges
 * - Exposes labelled histograms for durations with per-channel buckets (ms)
 */
import { errorsPerHour, lastFiveMinutes, msgsPerHour } from '@/lib/metrics/collectors';
import { getAllLabelledSamples } from '@/lib/metrics/hist';
import { getAllCounters } from '@/lib/monitoring/metrics';

/** Default latency buckets in milliseconds */
const BUCKETS_MS = [50, 100, 250, 500, 1000, 2000, 5000, 10000];

function escLabelValue(v: string) {
  return v.replace(/\\/g, '\\\\').replace(/\n/g, '\n').replace(/"/g, '\"');
}

function parseLabelKey(key: string): Record<string, string> {
  const out: Record<string, string> = {};
  if (!key) return out;
  for (const part of key.split(',')) {
    const [k, ...rest] = part.split('=');
    out[k] = rest.join('=');
  }
  return out;
}

function renderHistogram(metric: string, samples: number[], labels: Record<string, string>): string {
  const lines: string[] = [];
  const counts: number[] = BUCKETS_MS.map(() => 0);
  let sum = 0;
  for (const s of samples) {
    sum += s;
    let placed = false;
    for (let i = 0; i < BUCKETS_MS.length; i++) {
      if (s <= BUCKETS_MS[i]) {
        counts[i]++;
        placed = true;
        break;
      }
    }
    if (!placed) {
      // +Inf bucket handled later by cumulative sum
    }
  }
  // Convert to cumulative counts per Prom semantics
  let cumulative = 0;
  for (let i = 0; i < counts.length; i++) {
    cumulative += counts[i];
    const kv = Object.entries({ ...labels, le: String(BUCKETS_MS[i]) })
      .map(([k, v]) => `${k}="${escLabelValue(String(v))}"`).join(',');
    lines.push(`${metric}_bucket{${kv}} ${cumulative}`);
  }
  // +Inf bucket
  const kvInf = Object.entries({ ...labels, le: '+Inf' })
    .map(([k, v]) => `${k}="${escLabelValue(String(v))}"`).join(',');
  lines.push(`${metric}_bucket{${kvInf}} ${samples.length}`);
  // _sum and _count
  const kvBase = Object.entries(labels)
    .map(([k, v]) => `${k}="${escLabelValue(String(v))}"`).join(',');
  lines.push(`${metric}_sum{${kvBase}} ${sum}`);
  lines.push(`${metric}_count{${kvBase}} ${samples.length}`);
  return lines.join('\n');
}

/** Render all metrics in Prometheus exposition format */
export function renderPromMetrics(): string {
  const lines: string[] = [];

  // Gauges for recent counters
  const lastHourMsgs = msgsPerHour();
  const lastHourErrs = errorsPerHour();
  const recent = lastFiveMinutes();

  lines.push('# TYPE omni_msgs_last_hour gauge');
  lines.push('omni_msgs_last_hour ' + lastHourMsgs);
  lines.push('# TYPE omni_errors_last_hour gauge');
  lines.push('omni_errors_last_hour ' + lastHourErrs);
  lines.push('# TYPE omni_msgs_last_5min gauge');
  lines.push('omni_msgs_last_5min ' + recent.msgs);
  lines.push('# TYPE omni_errors_last_5min gauge');
  lines.push('omni_errors_last_5min ' + recent.errors);

  // Labelled histograms for durations (per-channel)
  const labelled = getAllLabelledSamples();
  for (const [metric, byLabel] of Object.entries(labelled)) {
    if (!byLabel || Object.keys(byLabel).length === 0) continue;
    lines.push(`# TYPE ${metric} histogram`);
    for (const [labelKey, samples] of Object.entries(byLabel)) {
      const labels = parseLabelKey(labelKey);
      if (samples.length === 0) continue;
      lines.push(renderHistogram(metric, samples, labels));
    }
  }

  // Labelled counters (e.g., inbound_total, outbound_total, dispatcher_total)
  const counters = getAllCounters();
  for (const [metric, byLabel] of Object.entries(counters)) {
    if (!byLabel || Object.keys(byLabel).length === 0) continue;
    lines.push(`# TYPE ${metric} counter`);
    for (const [labelKey, value] of Object.entries(byLabel)) {
      const labels = parseLabelKey(labelKey);
      const kv = Object.entries(labels).map(([k, v]) => `${k}="${escLabelValue(String(v))}"`).join(',');
      lines.push(`${metric}{${kv}} ${value}`);
    }
  }

  return lines.join('\n') + '\n';
}

/** Helper to get a JSON snapshot for UI (recent counters + hist stats per metric/label) */
export function getMonitoringSnapshot() {
  const recent = lastFiveMinutes();
  const hour = { msgs: msgsPerHour(), errors: errorsPerHour() };
  const labelled = getAllLabelledSamples();
  const hists: Record<string, Record<string, { count: number; min: number; max: number; avg: number }>> = {};
  for (const [metric, byLabel] of Object.entries(labelled)) {
    hists[metric] = {};
    for (const [lk, samples] of Object.entries(byLabel)) {
      if (samples.length === 0) { hists[metric][lk] = { count: 0, min: 0, max: 0, avg: 0 }; continue; }
      const min = Math.min(...samples);
      const max = Math.max(...samples);
      const sum = samples.reduce((a, b) => a + b, 0);
      hists[metric][lk] = { count: samples.length, min, max, avg: sum / samples.length };
    }
  }
  return { recent5m: recent, lastHour: hour, hists };
}
