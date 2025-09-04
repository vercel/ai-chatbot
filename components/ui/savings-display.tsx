'use client';

import * as React from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SavingsDisplayProps {
  monthlySavings: number;
  annualSavings: number;
  co2Reduction: number;
  installationDate?: Date;
  className?: string;
  onViewDetails?: () => void;
}

export function SavingsDisplay({
  monthlySavings,
  annualSavings,
  co2Reduction,
  installationDate,
  className,
  onViewDetails,
}: SavingsDisplayProps) {
  // Formatar valores monetários
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  // Calcular tempo desde a instalação se a data for fornecida
  const installationTime = installationDate
    ? Math.floor(
        (new Date().getTime() - installationDate.getTime()) /
          (1000 * 60 * 60 * 24 * 30),
      )
    : null;

  return (
    <Card variant="savings" className={cn('overflow-hidden', className)}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-2xl font-bold">Economia Solar</CardTitle>
          {installationTime && (
            <Badge variant="installation">
              {installationTime} meses de energia limpa
            </Badge>
          )}
        </div>
        <CardDescription>
          Acompanhe sua economia e impacto ambiental
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">
              Economia Mensal
            </p>
            <h3 className="text-2xl font-bold text-[hsl(var(--brand))]">
              {formatCurrency(monthlySavings)}
            </h3>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">
              Economia Anual
            </p>
            <h3 className="text-2xl font-bold text-[hsl(var(--brand-accent))]">
              {formatCurrency(annualSavings)}
            </h3>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Redução de CO₂
              </p>
              <p className="text-lg font-semibold">{co2Reduction} kg</p>
            </div>
            <Badge variant="eco">Energia Limpa</Badge>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button variant="solar" onClick={onViewDetails} className="w-full">
          Ver Detalhes Completos
        </Button>
      </CardFooter>
    </Card>
  );
}
