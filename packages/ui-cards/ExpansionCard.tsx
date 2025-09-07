import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export type ExpansionCardProps = Readonly<{
  areas?: Array<{ id: string; area_m2: number }>;
  generation?: { monthly: number[] } | null;
  onGenerateAlt?: () => void;
}>;

export function ExpansionCard({ areas = [], generation = null, onGenerateAlt }: ExpansionCardProps) {
  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <CardTitle>Expansion Analysis</CardTitle>
        <div className="text-sm text-muted-foreground">Areas: {areas.length}</div>
      </CardHeader>
      <CardContent>
        <div className="mb-2">Total area: <strong>{areas.reduce((s, a) => s + a.area_m2, 0)} m²</strong></div>
        <div className="mb-4 text-xs">Generation preview: {generation ? `${generation.monthly.slice(0,3).join(', ')}...` : '—'}</div>
        <div className="flex gap-2"><Button size="sm" onClick={onGenerateAlt}>Gerar alternativa</Button></div>
      </CardContent>
    </Card>
  );
}

export default ExpansionCard;
