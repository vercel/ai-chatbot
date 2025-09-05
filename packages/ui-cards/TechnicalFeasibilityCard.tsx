import React, { useRef } from 'react';
import { z } from 'zod';

// Schema validation for technical feasibility data
export const technicalFeasibilitySchema = z.object({
  roof_suitability: z.string(),
  site_constraints: z.array(z.string()),
  utility_rules: z.array(z.string()),
  viability_score: z.number().min(0).max(100),
});

export type TechnicalFeasibilityData = z.infer<typeof technicalFeasibilitySchema>;

export const TechnicalFeasibilityCard: React.FC<TechnicalFeasibilityData> = (props) => {
  const data = technicalFeasibilitySchema.parse(props);
  const ref = useRef<HTMLDivElement>(null);

  // Export card as PNG using dynamic import
  const exportAsPNG = async () => {
    if (!ref.current) return;
    const { toPng } = await import('html-to-image');
    const dataUrl = await toPng(ref.current);
    const link = document.createElement('a');
    link.download = 'technical-feasibility.png';
    link.href = dataUrl;
    link.click();
  };

  // Export card data as JSON
  const exportAsJSON = () => {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = 'technical-feasibility.json';
    link.href = url;
    link.click();
  };

  return (
    <div ref={ref} className="p-4 border rounded w-72">
      <div className="text-center">
        <span className="text-3xl font-bold">{data.viability_score}</span>
        <div className="text-sm">Score total</div>
      </div>
      <div className="mt-4">
        <span className="px-2 py-1 bg-blue-100 rounded-full text-xs">
          {data.roof_suitability}
        </span>
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        {data.site_constraints.map((c) => (
          <span key={c} className="px-2 py-1 bg-gray-200 rounded-full text-xs">
            {c}
          </span>
        ))}
      </div>
      <details className="mt-4">
        <summary className="cursor-pointer text-blue-500 underline text-sm">
          Ver regras da utilidade
        </summary>
        <ul className="mt-2 list-disc list-inside">
          {data.utility_rules.map((rule) => (
            <li key={rule}>{rule}</li>
          ))}
        </ul>
      </details>
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

export default TechnicalFeasibilityCard;

