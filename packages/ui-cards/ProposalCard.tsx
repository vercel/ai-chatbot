import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export type ProposalCardProps = Readonly<{
  leadId?: string;
  summary?: string;
  kWp?: number;
  paybackMonths?: number;
  onExportPDF?: () => void;
}>;

export function ProposalCard({ leadId, summary, kWp, paybackMonths, onExportPDF }: ProposalCardProps) {
  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <CardTitle>Proposal</CardTitle>
        <div className="text-sm text-muted-foreground">Lead: {leadId ?? '—'}</div>
      </CardHeader>
      <CardContent>
        <div className="mb-2">kWp: <strong>{kWp ?? '—'}</strong></div>
        <div className="mb-2">Payback: <strong>{paybackMonths ? `${paybackMonths} meses` : '—'}</strong></div>
        <div className="mb-4 text-xs">{summary}</div>
        <div className="flex gap-2"><Button size="sm" onClick={onExportPDF}>Gerar PDF</Button></div>
      </CardContent>
    </Card>
  );
}

export default ProposalCard;

