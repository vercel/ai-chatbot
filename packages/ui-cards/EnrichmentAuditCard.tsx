import React, { useEffect, useRef } from 'react';
import { z } from 'zod';

// Schema for individual enrichment events
export const eventSchema = z.object({
  source: z.string(),
  latency_ms: z.number().min(0),
  cache_hit: z.boolean(),
  fallback_used: z.boolean(),
});

export type EnrichmentEvent = z.infer<typeof eventSchema>;

// Aggregate audit information including latency histogram
export function summarizeEnrichment(
  events: EnrichmentEvent[],
  binSize = 50,
): {
  sources: string[];
  cache_hits: number;
  fallbacks_used: number;
  histogram: number[];
} {
  const valid = events.map((e) => eventSchema.parse(e));
  const sources = Array.from(new Set(valid.map((e) => e.source)));
  const cache_hits = valid.filter((e) => e.cache_hit).length;
  const fallbacks_used = valid.filter((e) => e.fallback_used).length;
  const latencies = valid.map((e) => e.latency_ms);
  const max = Math.max(0, ...latencies);
  const bins = Math.ceil(max / binSize) + 1;
  const histogram = Array(bins).fill(0);
  for (const l of latencies) {
    const idx = Math.floor(l / binSize);
    histogram[idx]++;
  }
  return { sources, cache_hits, fallbacks_used, histogram };
}

export interface EnrichmentAuditProps {
  events: EnrichmentEvent[];
  logUrl: string;
}

export const EnrichmentAuditCard: React.FC<EnrichmentAuditProps> = ({
  events,
  logUrl,
}) => {
  const summary = summarizeEnrichment(events);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      try {
        const Chart = (await import('chart.js/auto')).default;
        const ctx = (
          document.getElementById('latency-hist') as HTMLCanvasElement
        )?.getContext('2d');
        if (!ctx) return;
        new Chart(ctx, {
          type: 'bar',
          data: {
            labels: summary.histogram.map((_, i) => `${i * 50}-${i * 50 + 49}`),
            datasets: [
              {
                label: 'Latency',
                data: summary.histogram,
                backgroundColor: '#2563eb',
              },
            ],
          },
          options: { plugins: { legend: { display: false } } },
        });
      } catch {
        // Chart library not available
      }
    })();
  }, [summary]);

  const exportAsPNG = async () => {
    if (!ref.current) return;
    const { toPng } = await import('html-to-image');
    const dataUrl = await toPng(ref.current);
    const link = document.createElement('a');
    link.download = 'enrichment-audit.png';
    link.href = dataUrl;
    link.click();
  };

  const exportAsJSON = () => {
    const json = JSON.stringify(summary, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = 'enrichment-audit.json';
    link.href = url;
    link.click();
  };

  return (
    <div ref={ref} className="p-4 border rounded w-80">
      <div className="mb-2">
        <strong>Sources:</strong> {summary.sources.join(', ')}
      </div>
      <div className="flex gap-2 items-center mb-2 text-xs">
        <span className="px-2 py-1 rounded bg-green-100">
          Cache {summary.cache_hits}
        </span>
        <span className="px-2 py-1 rounded bg-yellow-100">
          Fallback {summary.fallbacks_used}
        </span>
        <a href={logUrl} className="ml-auto text-blue-600 underline">
          Logs
        </a>
      </div>
      <canvas id="latency-hist" width={300} height={150} className="mb-2" />
      <div className="flex gap-2 mt-2">
        <button
          type="button"
          onClick={exportAsPNG}
          className="px-2 py-1 border rounded"
        >
          PNG
        </button>
        <button
          type="button"
          onClick={exportAsJSON}
          className="px-2 py-1 border rounded"
        >
          JSON
        </button>
      </div>
    </div>
  );
};

export default EnrichmentAuditCard;
