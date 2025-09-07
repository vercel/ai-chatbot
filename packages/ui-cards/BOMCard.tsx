import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export type BOMItem = { sku: string; brand?: string; qty: number; unitCost: number };

export type BOMCardProps = Readonly<{
  items?: BOMItem[];
  onExport?: () => void;
}>;

export function BOMCard({ items = [], onExport }: BOMCardProps) {
  const total = items.reduce((s, i) => s + i.qty * i.unitCost, 0);
  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <CardTitle>BOM</CardTitle>
        <div className="text-sm text-muted-foreground">Items: {items.length}</div>
      </CardHeader>
      <CardContent>
        <div className="mb-2 text-xs">
          <table className="w-full text-xs">
            <thead>
              <tr>
                <th className="text-left">SKU</th>
                <th className="text-right">Qty</th>
                <th className="text-right">Unit</th>
                <th className="text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it) => (
                <tr key={it.sku}>
                  <td>{it.sku}</td>
                  <td className="text-right">{it.qty}</td>
                  <td className="text-right">{it.unitCost.toFixed(2)}</td>
                  <td className="text-right">{(it.qty * it.unitCost).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mb-2">Total: <strong>{total.toFixed(2)}</strong></div>
        <div className="flex gap-2"><Button size="sm" onClick={onExport}>Exportar CSV</Button></div>
      </CardContent>
    </Card>
  );
}

export default BOMCard;
