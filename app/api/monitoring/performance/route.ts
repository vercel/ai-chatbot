import { NextResponse } from 'next/server';
import { getAllCounters, getP95Snapshot } from '@/lib/monitoring/metrics';

export const dynamic = 'force-dynamic';

export async function GET() {
  const counters = getAllCounters();
  const p95 = getP95Snapshot();

  // Flatten label keys for common case { channel=xxx }
  function flatten(obj: Record<string, Record<string, number>>): Record<string, Record<string, number>> {
    const out: Record<string, Record<string, number>> = {};
    for (const [metric, byLabel] of Object.entries(obj)) {
      out[metric] = {};
      for (const [lk, v] of Object.entries(byLabel)) {
        const parts = lk.split(',').map((s) => s.trim()).filter(Boolean);
        const map: Record<string, string> = {};
        for (const p of parts) {
          const i = p.indexOf('=');
          if (i > 0) map[p.slice(0, i)] = p.slice(i + 1);
        }
        const key = map.channel || map.provider || lk || 'all';
        out[metric][key] = v;
      }
    }
    return out;
  }

  const data = { counters: flatten(counters), p95: flatten(p95), ts: Date.now() };
  return NextResponse.json(data);
}
