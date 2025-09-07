import React from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export type OpportunityCardProps = Readonly<{
  score?: number;
  assumptions?: Record<string, number>;
  onAdjust?: (updates: Record<string, number>) => void;
}>;

export function OpportunityCard({ score = 0, assumptions = {}, onAdjust }: OpportunityCardProps) {
  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <CardTitle>Opportunity</CardTitle>
        <div className="text-sm text-muted-foreground">Score: {Math.round(score)}</div>
      </CardHeader>
      <CardContent>
        <div className="mb-2">Assumptions</div>
        <pre className="text-xs bg-surface p-2 rounded">{JSON.stringify(assumptions, null, 2)}</pre>
        <div className="flex gap-2 mt-2">
          <Button size="sm" onClick={() => onAdjust?.({})}>Ajustar premissas</Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default OpportunityCard;
