import React, { useRef, useState } from 'react';
import { ChartKit } from '../ui-charts';
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
  const cardRef = useRef<HTMLDivElement>(null);

  const scores = parsed.anomalies.map((a) => a.score);
  const width = 300;
  const height = 160;

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
      <div className="relative" style={{ width, height }}>
        <ChartKit
          type="histogram"
          data={scores}
          width={width}
          height={height}
          ariaLabel="Outliers chart"
        />
        <svg
          width={width}
          height={height}
          className="absolute top-0 left-0 pointer-events-none"
        >
          <line
            x1={thresholds.lower * width}
            x2={thresholds.lower * width}
            y1={0}
            y2={height}
            stroke="#dc2626"
            strokeWidth={2}
          />
          <line
            x1={thresholds.upper * width}
            x2={thresholds.upper * width}
            y1={0}
            y2={height}
            stroke="#dc2626"
            strokeWidth={2}
          />
        </svg>
      </div>
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
            <tr
              key={a.feature}
              className={isOutlier(a.score, thresholds) ? 'text-red-600' : undefined}
            >
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
