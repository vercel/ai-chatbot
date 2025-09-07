import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export type BOMCardProps = Readonly<{
  items?: Array<{ sku: string; qty: number; price: number }>;
  onExport?: () => void;
}>;

export function BOMCard({ items = [], onExport }: BOMCardProps) {
  const total = items.reduce((s, i) => s + i.qty * i.price, 0);
  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <CardTitle>BOM</CardTitle>
        <div className="text-sm text-muted-foreground">
          Items: {items.length}
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-2">Total: R$ {total.toFixed(2)}</div>
        <div className="overflow-auto max-h-40 mb-2">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="text-left">SKU</th>
                <th className="text-right">Qty</th>
                <th className="text-right">Price</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it) => (
                <tr key={it.sku}>
                  <td>{it.sku}</td>
                  <td className="text-right">{it.qty}</td>
                  <td className="text-right">R$ {it.price.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={onExport}>
            Exportar CSV
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default BOMCard;
