import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export type PanelDetectionCardProps = Readonly<{
  provider?: string;
  bbox?: [number, number, number, number];
  assetsCount?: number;
  onReRun?: (opts?: { radius?: number; source?: string }) => void;
}>;

export function PanelDetectionCard({ provider, bbox, assetsCount = 0, onReRun }: PanelDetectionCardProps) {
  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <CardTitle>Panel Detection</CardTitle>
        <div className="text-sm text-muted-foreground">{provider ?? 'STAC'}</div>
      </CardHeader>
      <CardContent>
        <div className="mb-2">Assets found: <strong>{assetsCount}</strong></div>
        {bbox && (
          <div className="mb-4 text-xs">BBox: <code>{JSON.stringify(bbox)}</code></div>
        )}
        <div className="flex gap-2">
          <Button size="sm" onClick={() => onReRun?.()}>Reexecutar detecção</Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default PanelDetectionCard;
