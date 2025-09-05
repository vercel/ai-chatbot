import React, { useMemo } from 'react';
import { z } from 'zod';
import Papa from 'papaparse';

// Schema for a financing offer
export const financingOfferSchema = z.object({
  provider: z.string(),
  rate: z.number(),
  term: z.number(), // in months
  monthly: z.number(), // monthly payment
});

export type FinancingOffer = z.infer<typeof financingOfferSchema>;

export const financingCardSchema = z.object({
  offers: z.array(financingOfferSchema),
});

export type FinancingCardProps = z.infer<typeof financingCardSchema>;

// Helper to calculate total cost
export function getTotalCost(offer: FinancingOffer): number {
  return offer.monthly * offer.term;
}

// Sort offers by total cost ascending
export function sortOffersByTotalCost(
  offers: FinancingOffer[],
): FinancingOffer[] {
  return offers.slice().sort((a, b) => getTotalCost(a) - getTotalCost(b));
}

export const FinancingCard: React.FC<FinancingCardProps> = (props) => {
  const { offers } = financingCardSchema.parse(props);

  // Sorted offers memoized for performance
  const sorted = useMemo(() => sortOffersByTotalCost(offers), [offers]);
  const best = sorted[0];

  const exportAsCSV = () => {
    const rows = sorted.map((o) => ({ ...o, total: getTotalCost(o) }));
    const csv = Papa.unparse(rows);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = 'financing-options.csv';
    link.href = url;
    link.click();
  };

  const exportAsJSON = () => {
    const json = JSON.stringify(
      sorted.map((o) => ({ ...o, total: getTotalCost(o) })),
      null,
      2,
    );
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = 'financing-options.json';
    link.href = url;
    link.click();
  };

  return (
    <div className="p-4 border rounded w-full max-w-md">
      <table className="w-full text-sm" aria-label="financing offers">
        <thead>
          <tr>
            <th scope="col" className="text-left">
              Provider
            </th>
            <th scope="col" className="text-right">
              Rate (%)
            </th>
            <th scope="col" className="text-right">
              Term (m)
            </th>
            <th scope="col" className="text-right">
              Monthly
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((o) => (
            <tr
              key={o.provider}
              className={o === best ? 'bg-yellow-100 font-bold' : ''}
              aria-label={o === best ? 'best option' : undefined}
            >
              <td>{o.provider}</td>
              <td className="text-right">{o.rate.toFixed(2)}</td>
              <td className="text-right">{o.term}</td>
              <td className="text-right">{o.monthly.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex gap-2 mt-4">
        <button
          type="button"
          onClick={exportAsCSV}
          className="px-2 py-1 border rounded"
          aria-label="export csv"
        >
          CSV
        </button>
        <button
          type="button"
          onClick={exportAsJSON}
          className="px-2 py-1 border rounded"
          aria-label="export json"
        >
          JSON
        </button>
      </div>
    </div>
  );
};

export default FinancingCard;
