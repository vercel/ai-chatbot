import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export type OpportunityCardProps = Readonly<{
  score?: number;
  shading?: boolean;
  assumptions?: Record<string, number>;
  onSimulate?: () => void;
}>;

export function OpportunityCard({ score = 0, shading = false, assumptions = {}, onSimulate }: OpportunityCardProps) {
  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <CardTitle>Solar Opportunity</CardTitle>
        <div className="text-sm text-muted-foreground">Score: {Math.round(score)}</div>
      </CardHeader>
      <CardContent>
        <div className="mb-2">Shading detected: <strong>{shading ? 'Yes' : 'No'}</strong></div>
        <div className="mb-4 text-xs">Assumptions: <pre>{JSON.stringify(assumptions, null, 2)}</pre></div>
        <div className="flex gap-2">
          <Button size="sm" onClick={onSimulate}>Simular</Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default OpportunityCard;
