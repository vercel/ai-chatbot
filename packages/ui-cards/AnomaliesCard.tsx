import React, { useEffect, useRef, useState } from 'react';
import { z } from 'zod';

export const anomalySchema = z.object({
  feature: z.string(),
  score: z.number(),
  type: z.string(),
});

export const thresholdsSchema = z.object({
  lower: z.number().default(0),
  upper: z.number().default(1),
});

export const anomaliesCardSchema = z.object({
  anomalies: z.array(anomalySchema),
  thresholds: thresholdsSchema,
});

export type AnomaliesCardProps = z.infer<typeof anomaliesCardSchema>;
export type Thresholds = z.infer<typeof thresholdsSchema>;

// Utility to determine whether a score is an outlier
export function isOutlier(score: number, thresholds: Thresholds): boolean {
  return score < thresholds.lower || score > thresholds.upper;
}

export const AnomaliesCard: React.FC<AnomaliesCardProps> = (props) => {
  const parsed = anomaliesCardSchema.parse(props);
  const [thresholds, setThresholds] = useState(parsed.thresholds);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<any>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  // Draw chart using Chart.js
  useEffect(() => {
    (async () => {
      try {
        const ChartKit = (await import('chart.js/auto')).default;
        if (!canvasRef.current) return;
        const labels = parsed.anomalies.map((a) => a.feature);
        const scores = parsed.anomalies.map((a) => a.score);
        const colors = parsed.anomalies.map((a) =>
          isOutlier(a.score, thresholds) ? '#dc2626' : '#16a34a',
        );
        chartRef.current?.destroy();
        chartRef.current = new ChartKit(canvasRef.current, {
          type: 'bar',
          data: {
            labels,
            datasets: [
              {
                label: 'Anomaly Score',
                data: scores,
                backgroundColor: colors,
              },
            ],
          },
          options: {
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true, max: 1 } },
          },
        });
      } catch {
        // Chart library not available
      }
    })();
  }, [parsed.anomalies, thresholds]);

  const exportAsPNG = async () => {
    if (!cardRef.current) return;
    const { toPng } = await import('html-to-image');
    const dataUrl = await toPng(cardRef.current);
    const link = document.createElement('a');
    link.download = 'anomalies.png';
    link.href = dataUrl;
    link.click();
  };

  const exportAsJSON = () => {
    const json = JSON.stringify({ anomalies: parsed.anomalies, thresholds }, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = 'anomalies.json';
    link.href = url;
    link.click();
  };

  return (
    <div ref={cardRef} className="p-4 border rounded w-80">
      <canvas
        ref={canvasRef}
        role="img"
        aria-label="Outliers chart"
        className="w-full h-40"
      />
      <div className="mt-4 space-y-2">
        <label className="flex items-center gap-2">
          <span>Lower</span>
          <input
            aria-label="Lower threshold"
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={thresholds.lower}
            onChange={(e) =>
              setThresholds({ ...thresholds, lower: Number(e.target.value) })
            }
          />
          <span>{thresholds.lower.toFixed(2)}</span>
        </label>
        <label className="flex items-center gap-2">
          <span>Upper</span>
          <input
            aria-label="Upper threshold"
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={thresholds.upper}
            onChange={(e) =>
              setThresholds({ ...thresholds, upper: Number(e.target.value) })
            }
          />
          <span>{thresholds.upper.toFixed(2)}</span>
        </label>
      </div>
      <table className="w-full mt-4 text-sm">
        <thead>
          <tr>
            <th className="text-left">Feature</th>
            <th className="text-right">Score</th>
            <th className="text-right">Type</th>
          </tr>
        </thead>
        <tbody>
          {parsed.anomalies.map((a) => (
            <tr key={a.feature}>
              <td>{a.feature}</td>
              <td className="text-right">{a.score}</td>
              <td className="text-right">{a.type}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex gap-2 mt-4">
        <button type="button" onClick={exportAsPNG} className="px-2 py-1 border rounded">
          PNG
        </button>
        <button type="button" onClick={exportAsJSON} className="px-2 py-1 border rounded">
          JSON
        </button>
      </div>
    </div>
  );
};

export default AnomaliesCard;
