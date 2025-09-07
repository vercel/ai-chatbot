import React from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export type PanelDetectionCardProps = {
  provider?: string;
  bbox?: [number, number, number, number];
  source?: string;
  onReRun?: () => void;
};

export function PanelDetectionCard({ provider, bbox, source, onReRun }: PanelDetectionCardProps) {
  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <CardTitle>Panel Detection</CardTitle>
        <div className="text-sm text-muted-foreground">{provider ?? 'unknown'}</div>
      </CardHeader>
      <CardContent>
        <div className="mb-2">BBox: {bbox ? bbox.join(', ') : '—'}</div>
        <div className="mb-4">Source: {source ?? '—'}</div>
        <div className="flex gap-2">
          <Button size="sm" onClick={onReRun}>Reexecutar detecção</Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default PanelDetectionCard;
