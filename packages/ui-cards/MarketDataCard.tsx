import React, { useRef, useState } from 'react';
import { z } from 'zod';

// Schema for a single market offer
export const offerSchema = z.object({
  vendor: z.string(),
  sku: z.string(),
  price: z.number(),
  stamp: z.date(),
});

export type Offer = z.infer<typeof offerSchema>;

export const offersSchema = z.array(offerSchema);

// Calculate delta vs previous offer (sorted by stamp)
export function calculateDeltas(offers: Offer[]): Array<Offer & { delta: number }> {
  const sorted = [...offers].sort((a, b) => a.stamp.getTime() - b.stamp.getTime());
  return sorted.map((o, i) => ({
    ...o,
    delta: i === 0 ? 0 : o.price - sorted[i - 1].price,
  }));
}

export interface MarketDataProps {
  offers: Offer[];
}

export const MarketDataCard: React.FC<MarketDataProps> = ({ offers }) => {
  const initial = offersSchema.parse(offers);
  const [data, setData] = useState<Offer[]>(initial);
  const ref = useRef<HTMLDivElement>(null);

  const rows = calculateDeltas(data);

  const importCSV = async (file: File) => {
    const Papa = await import('papaparse');
    Papa.parse<Offer>(file, {
      header: true,
      dynamicTyping: true,
      complete: (results) => {
        const parsed: Offer[] = [];
        for (const r of results.data as any[]) {
          if (r.vendor && r.sku && r.price && r.stamp) {
            parsed.push({
              vendor: String(r.vendor),
              sku: String(r.sku),
              price: Number(r.price),
              stamp: new Date(r.stamp),
            });
          }
        }
        setData(parsed);
      },
    });
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) importCSV(file);
  };

  const exportAsJSON = () => {
    const json = JSON.stringify(rows, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = 'market-data.json';
    link.href = url;
    link.click();
  };

  const exportAsCSV = async () => {
    const { unparse } = await import('papaparse');
    const csv = unparse(
      rows.map((r) => ({
        ...r,
        stamp: r.stamp.toISOString(),
      })),
    );
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = 'market-data.csv';
    link.href = url;
    link.click();
  };

  const exportAsPNG = async () => {
    if (!ref.current) return;
    const { toPng } = await import('html-to-image');
    const dataUrl = await toPng(ref.current);
    const link = document.createElement('a');
    link.download = 'market-data.png';
    link.href = dataUrl;
    link.click();
  };

  const prices = rows.map((r) => r.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const width = 300;
  const height = 150;
  const path = rows
    .map((r, i) => {
      const x = (i / Math.max(rows.length - 1, 1)) * width;
      const y =
        maxPrice === minPrice
          ? height / 2
          : height - ((r.price - minPrice) / (maxPrice - minPrice)) * height;
      return `${i === 0 ? 'M' : 'L'}${x},${y}`;
    })
    .join(' ');

  return (
    <div ref={ref} className="p-4 border rounded w-[420px]">
      <input type="file" accept=".csv" onChange={handleFile} className="mb-2" />
      <svg width={width} height={height} className="mb-4 border">
        <path d={path} stroke="#2563eb" fill="none" />
      </svg>
      <table className="w-full text-sm">
        <thead>
          <tr>
            <th className="text-left">Vendor</th>
            <th className="text-left">SKU</th>
            <th className="text-right">Price</th>
            <th className="text-right">Delta</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, idx) => (
            <tr key={`${r.vendor}-${r.sku}-${idx}`}>
              <td>{r.vendor}</td>
              <td>{r.sku}</td>
              <td className="text-right">{r.price.toFixed(2)}</td>
              <td className="text-right">{r.delta.toFixed(2)}</td>
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
        <button type="button" onClick={exportAsCSV} className="px-2 py-1 border rounded">
          CSV
        </button>
      </div>
    </div>
  );
};

export default MarketDataCard;
