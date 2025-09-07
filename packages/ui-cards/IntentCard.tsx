import React from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export type IntentCardProps = Readonly<{
  intent?: string;
  confidence?: number; // 0-1
  features?: Record<string, number>;
  onConfirm?: () => void;
}>;

export function IntentCard({ intent, confidence = 0, features = {}, onConfirm }: IntentCardProps) {
  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <CardTitle>Intent Classification</CardTitle>
        <div className="text-sm text-muted-foreground">{(confidence * 100).toFixed(0)}%</div>
      </CardHeader>
      <CardContent>
        <div className="mb-2">Predicted intent: <strong>{intent ?? '—'}</strong></div>
        <div className="mb-4">
          <div className="text-xs font-medium mb-1">Features</div>
          <pre className="text-xs bg-surface p-2 rounded">{JSON.stringify(features, null, 2)}</pre>
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={onConfirm}>Confirmar intenção</Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default IntentCard;
