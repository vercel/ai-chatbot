import React from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export type ProposalCardProps = Readonly<{
  summary?: string;
  kWp?: number;
  paybackYears?: number;
  onGeneratePDF?: () => void;
}>;

export function ProposalCard({ summary = '', kWp = 0, paybackYears = 0, onGeneratePDF }: ProposalCardProps) {
  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <CardTitle>Proposal</CardTitle>
        <div className="text-sm text-muted-foreground">kWp: {kWp}</div>
      </CardHeader>
      <CardContent>
        <div className="mb-2 font-medium">Resumo executivo</div>
        <div className="mb-4 text-sm">{summary || '—'}</div>
        <div className="mb-4">Payback: {paybackYears} anos</div>
        <div className="flex gap-2">
          <Button size="sm" onClick={onGeneratePDF}>Gerar PDF</Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default ProposalCard;
