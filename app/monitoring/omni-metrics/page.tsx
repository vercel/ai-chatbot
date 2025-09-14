"use client";

import { useEffect, useState } from 'react';

interface Summary {
  recent5m: { msgs: number; errors: number };
  lastHour: { msgs: number; errors: number };
  hists: Record<string, Record<string, { count: number; min: number; max: number; avg: number }>>;
}

export default function OmniMetricsPage() {
  const [prom, setProm] = useState<string>('');
  const [summary, setSummary] = useState<Summary | null>(null);

  async function refresh() {
    try {
      const [promText, summaryJson] = await Promise.all([
        fetch('/api/metrics', { cache: 'no-store' }).then((r) => r.text()),
        fetch('/api/monitoring/summary', { cache: 'no-store' }).then((r) => r.json() as Promise<Summary>),
      ]);
      setProm(promText);
      setSummary(summaryJson);
    } catch {
      // noop
    }
  }

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 10000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Omni Metrics</h1>
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        <div className="border rounded-md p-4">
          <h2 className="font-medium mb-2">Recent Counters</h2>
          <div className="text-sm text-muted-foreground">Last 5 minutes</div>
          <div className="mt-1">Msgs: {summary?.recent5m.msgs ?? 0} | Errors: {summary?.recent5m.errors ?? 0}</div>
          <div className="text-sm text-muted-foreground mt-4">Last hour</div>
          <div className="mt-1">Msgs: {summary?.lastHour.msgs ?? 0} | Errors: {summary?.lastHour.errors ?? 0}</div>
          <div className="mt-4">
            <h3 className="font-medium">Per-channel latency (ms)</h3>
            <div className="mt-2 space-y-2">
              {summary && Object.entries(summary.hists).map(([metric, byLabel]) => (
                <div key={metric}>
                  <div className="text-sm font-mono">{metric}</div>
                  {Object.entries(byLabel).map(([labelKey, s]) => (
                    <div key={labelKey} className="text-sm ml-2">
                      <div>{labelKey} → count {s.count}, avg {s.avg.toFixed(1)}, min {s.min}, max {s.max}</div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="border rounded-md p-4">
          <h2 className="font-medium mb-2">Prometheus Snapshot</h2>
          <pre className="text-xs whitespace-pre-wrap bg-muted/30 p-3 rounded-md max-h-[60vh] overflow-auto">{prom}</pre>
        </div>
      </div>
    </div>
  );
}

