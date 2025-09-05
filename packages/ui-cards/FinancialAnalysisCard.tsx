import React, { useEffect, useMemo, useRef, useState } from 'react';
import Papa from 'papaparse';
import { z } from 'zod';

export const assumptionsSchema = z.object({
  tariff: z.number().min(0),
  losses: z.number().min(0).max(1),
  years: z.number().int().min(1),
});

export type Assumptions = z.infer<typeof assumptionsSchema>;

export interface Indicators {
  roi: number; // percentage
  npv: number; // currency
  irr: number; // percentage
  cashFlows: number[];
}

// Internal rate of return using Newton-Raphson
export function computeIRR(cashFlows: number[], guess = 0.1): number {
  let irr = guess;
  for (let i = 0; i < 20; i++) {
    let npv = 0;
    let dnpv = 0;
    for (let t = 0; t < cashFlows.length; t++) {
      const cf = cashFlows[t];
      npv += cf / Math.pow(1 + irr, t);
      dnpv -= (t * cf) / Math.pow(1 + irr, t + 1);
    }
    irr -= npv / dnpv;
  }
  return irr * 100;
}

// Compute ROI, NPV, IRR based on assumptions
export function computeIndicators(raw: Assumptions): Indicators {
  const data = assumptionsSchema.parse(raw);
  const investment = 100; // initial cost
  const annualRevenue = data.tariff * (1 - data.losses);
  const cashFlows = [-investment];
  for (let i = 0; i < data.years; i++) {
    cashFlows.push(annualRevenue);
  }
  const discount = 0.1;
  const npv = cashFlows.reduce((acc, cf, i) => acc + cf / Math.pow(1 + discount, i), 0);
  const roi =
    ((cashFlows.slice(1).reduce((a, b) => a + b, 0) - investment) / investment) * 100;
  const irr = computeIRR(cashFlows);
  return { roi, npv, irr, cashFlows };
}

const scenarios: Record<string, Assumptions> = {
  base: { tariff: 100, losses: 0.1, years: 5 },
  optimistic: { tariff: 120, losses: 0.05, years: 5 },
  pessimistic: { tariff: 80, losses: 0.15, years: 5 },
};

export const FinancialAnalysisCard: React.FC = () => {
  const [scenario, setScenario] = useState<keyof typeof scenarios>('base');
  const [assumptions, setAssumptions] = useState<Assumptions>(scenarios[scenario]);
  const indicators = useMemo(() => computeIndicators(assumptions), [assumptions]);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setAssumptions(scenarios[scenario]);
  }, [scenario]);

  useEffect(() => {
    (async () => {
      try {
        const Chart = (await import('chart.js/auto')).default;
        const ctx = (document.getElementById('waterfall') as HTMLCanvasElement)?.getContext('2d');
        if (!ctx) return;
        new Chart(ctx, {
          type: 'bar',
          data: {
            labels: [
              'Investimento',
              ...Array(assumptions.years).fill(0).map((_, i) => `Ano ${i + 1}`),
            ],
            datasets: [
              {
                label: 'Fluxo de Caixa',
                data: indicators.cashFlows,
                backgroundColor: [
                  '#dc2626',
                  ...Array(indicators.cashFlows.length - 1).fill('#16a34a'),
                ],
              },
            ],
          },
          options: {
            plugins: { legend: { display: false } },
            scales: { x: { display: false } },
          },
        });
      } catch {
        // Chart library not available
      }
    })();
  }, [indicators]);

  const exportAsPNG = async () => {
    if (!ref.current) return;
    const { toPng } = await import('html-to-image');
    const dataUrl = await toPng(ref.current);
    const link = document.createElement('a');
    link.download = 'financial-analysis.png';
    link.href = dataUrl;
    link.click();
  };

  const exportAsJSON = () => {
    const json = JSON.stringify({ assumptions, indicators }, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = 'financial-analysis.json';
    link.href = url;
    link.click();
  };

  const exportAsCSV = () => {
    const csv = Papa.unparse(
      indicators.cashFlows.map((v, i) => ({ year: i, value: v })),
    );
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = 'financial-analysis.csv';
    link.href = url;
    link.click();
  };

  return (
    <div ref={ref} className="p-4 border rounded w-80">
      <div className="flex gap-2 mb-4">
        <label className="flex flex-col">
          Cenário
          <select
            value={scenario}
            onChange={(e) => setScenario(e.target.value as keyof typeof scenarios)}
            className="border p-1"
          >
            {Object.keys(scenarios).map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col">
          Tarifa
          <input
            type="number"
            value={assumptions.tariff}
            onChange={(e) =>
              setAssumptions({ ...assumptions, tariff: Number(e.target.value) })
            }
            className="border p-1"
          />
        </label>
        <label className="flex flex-col">
          Perdas (%)
          <input
            type="number"
            value={assumptions.losses * 100}
            onChange={(e) =>
              setAssumptions({ ...assumptions, losses: Number(e.target.value) / 100 })
            }
            className="border p-1"
          />
        </label>
      </div>
      <canvas id="waterfall" className="w-full h-40" />
      <div className="mt-4 text-sm">
        <div>ROI: {indicators.roi.toFixed(2)}%</div>
        <div>TIR: {indicators.irr.toFixed(2)}%</div>
        <div>VPL: {indicators.npv.toFixed(2)}</div>
      </div>
      <div className="flex gap-2 mt-4">
        <button type="button" onClick={exportAsPNG} className="px-2 py-1 border rounded">
          PNG
        </button>
        <button type="button" onClick={exportAsCSV} className="px-2 py-1 border rounded">
          CSV
        </button>
        <button type="button" onClick={exportAsJSON} className="px-2 py-1 border rounded">
          JSON
        </button>
      </div>
    </div>
  );
};

export default FinancialAnalysisCard;
