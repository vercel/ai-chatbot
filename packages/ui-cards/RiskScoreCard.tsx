import React, { useRef } from 'react';
import { z } from 'zod';

// Schema validation for Risk Score data
export const riskScoreSchema = z.object({
  score: z.number().min(0).max(100),
  drivers: z.array(z.object({ label: z.string(), value: z.number() })),
});

export type RiskScoreData = z.infer<typeof riskScoreSchema>;

export type RiskBucket = 'low' | 'medium' | 'high';

// Determine bucket and color based on score
export function getRiskBucket(score: number): { bucket: RiskBucket; color: string } {
  if (score < 34) return { bucket: 'low', color: '#16a34a' }; // green
  if (score < 67) return { bucket: 'medium', color: '#facc15' }; // yellow
  return { bucket: 'high', color: '#dc2626' }; // red
}

export const RiskScoreCard: React.FC<RiskScoreData> = (props) => {
  const data = riskScoreSchema.parse(props);
  const { bucket, color } = getRiskBucket(data.score);
  const ref = useRef<HTMLDivElement>(null);

  // Export card as PNG using dynamic import to avoid bundling issues
  const exportAsPNG = async () => {
    if (!ref.current) return;
    const { toPng } = await import('html-to-image');
    const dataUrl = await toPng(ref.current);
    const link = document.createElement('a');
    link.download = 'risk-score.png';
    link.href = dataUrl;
    link.click();
  };

  // Export card data as JSON
  const exportAsJSON = () => {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = 'risk-score.json';
    link.href = url;
    link.click();
  };

  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (data.score / 100) * circumference;

  return (
    <div ref={ref} className="p-4 border rounded w-64">
      <div className="relative w-32 h-32 mx-auto">
        <svg width={160} height={160}>
          <circle
            cx="80"
            cy="80"
            r={radius}
            stroke="#e5e7eb"
            strokeWidth="10"
            fill="none"
          />
          <circle
            cx="80"
            cy="80"
            r={radius}
            stroke={color}
            strokeWidth="10"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            transform="rotate(-90 80 80)"
          />
          <text x="80" y="90" textAnchor="middle" fontSize="24">
            {data.score}
          </text>
        </svg>
      </div>
      <div className="text-center mt-2">
        <span className="font-bold" style={{ color }}>
          {bucket.toUpperCase()}
        </span>
      </div>
      <table className="w-full mt-4 text-sm">
        <thead>
          <tr>
            <th className="text-left">Driver</th>
            <th className="text-right">Value</th>
          </tr>
        </thead>
        <tbody>
          {data.drivers.map((d) => (
            <tr key={d.label}>
              <td>{d.label}</td>
              <td className="text-right">{d.value}</td>
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

export default RiskScoreCard;
