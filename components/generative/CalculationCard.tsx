'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Calculator } from 'lucide-react';

interface CalculationData {
  expression: string;
  result?: number;
  error?: string;
}

interface CalculationCardProps {
  data: CalculationData;
}

export function CalculationCard({ data }: CalculationCardProps) {
  return (
    <Card className="p-4 w-full max-w-sm">
      <div className="flex items-center gap-3">
        <Calculator className="h-6 w-6 text-primary" />
        <div className="flex-1">
          <p className="text-sm text-muted-foreground font-mono">{data.expression}</p>
          {data.error ? (
            <p className="text-red-500 text-sm mt-1">{data.error}</p>
          ) : (
            <p className="text-2xl font-bold mt-1">= {data.result}</p>
          )}
        </div>
      </div>
    </Card>
  );
}