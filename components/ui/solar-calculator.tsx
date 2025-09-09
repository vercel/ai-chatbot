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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface SolarCalculatorProps {
  className?: string;
  onCalculationComplete?: (results: SolarCalculationResults) => void;
}

interface SolarCalculationResults {
  monthlySavings: number;
  annualSavings: number;
  co2Reduction: number;
  paybackPeriod: number; // em anos
  recommendedSystem: {
    power: number; // em kWp
    panelCount: number;
    estimatedCost: number;
  };
}

export function SolarCalculator({
  className,
  onCalculationComplete,
}: Readonly<SolarCalculatorProps>) {
  // Estados para armazenar os inputs do usuário
  const [monthlyConsumption, setMonthlyConsumption] =
    React.useState<number>(300);
  const [electricityRate, setElectricityRate] = React.useState<number>(0.85);
  const [roofArea, setRoofArea] = React.useState<number>(30);
  const [sunExposure, setSunExposure] = React.useState<string>('high');
  const [loading, setLoading] = React.useState<boolean>(false);
  const [results, setResults] = React.useState<SolarCalculationResults | null>(
    null,
  );

  // Função para calcular os resultados
  const calculateResults = () => {
    setLoading(true);

    // Simulando um tempo de cálculo
    setTimeout(() => {
      // Fatores de exposição solar (simplificados)
      const sunExposureFactor =
        sunExposure === 'high' ? 1.2 : sunExposure === 'medium' ? 1.0 : 0.8;

      // Cálculos básicos (simplificados para demonstração)
      const estimatedPowerNeeded =
        (monthlyConsumption / 120) * sunExposureFactor; // em kWp
      const panelCount = Math.ceil(estimatedPowerNeeded / 0.4); // Assumindo painéis de 400W
      const requiredArea = panelCount * 2; // Área aproximada
      const canFit = requiredArea <= roofArea;

      // Ajuste se não couber no telhado
      const adjustedPower = canFit
        ? estimatedPowerNeeded
        : (roofArea / 2) * 0.4;
      const adjustedPanelCount = canFit ? panelCount : Math.floor(roofArea / 2);

      // Cálculos econômicos
      const monthlyGeneration = adjustedPower * 120 * sunExposureFactor;
      const monthlySavings = monthlyGeneration * electricityRate;
      const annualSavings = monthlySavings * 12;
      const systemCost = adjustedPower * 5000; // Custo estimado do sistema
      const paybackPeriod = systemCost / annualSavings;

      // Impacto ambiental
      const co2Reduction = monthlyGeneration * 0.085 * 12; // kg de CO2/ano

      const calculationResults: SolarCalculationResults = {
        monthlySavings,
        annualSavings,
        co2Reduction,
        paybackPeriod,
        recommendedSystem: {
          power: adjustedPower,
          panelCount: adjustedPanelCount,
          estimatedCost: systemCost,
        },
      };

      setResults(calculationResults);
      onCalculationComplete?.(calculationResults);
      setLoading(false);
    }, 1500);
  };

  // Formatadores para os valores
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader>
        <CardTitle className="text-2xl font-bold">
          Calculadora Solar YSH
        </CardTitle>
        <CardDescription>
          Descubra o potencial de economia com energia solar para sua residência
          ou negócio
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="consumption">Consumo Mensal (kWh)</Label>
            <Input
              id="consumption"
              type="number"
              min="0"
              value={monthlyConsumption}
              onChange={(e) => setMonthlyConsumption(Number(e.target.value))}
            />
            <p className="text-xs text-muted-foreground">
              Encontre este valor na sua conta de energia
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="rate">Tarifa de Energia (R$/kWh)</Label>
            <Input
              id="rate"
              type="number"
              step="0.01"
              min="0"
              value={electricityRate}
              onChange={(e) => setElectricityRate(Number(e.target.value))}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="roof">Área de Telhado Disponível (m²)</Label>
            <Input
              id="roof"
              type="number"
              min="0"
              value={roofArea}
              onChange={(e) => setRoofArea(Number(e.target.value))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="exposure">Exposição Solar</Label>
            <select
              id="exposure"
              value={sunExposure}
              onChange={(e) => setSunExposure(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="high">Alta (sem sombras)</option>
              <option value="medium">Média (algumas sombras)</option>
              <option value="low">Baixa (muitas sombras)</option>
            </select>
          </div>
        </div>

        {results && (
          <div className="mt-6 p-4 bg-muted/50 rounded-lg space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="text-lg font-medium">Resultados Estimados</h4>
              <Badge variant="installation">Economia Solar</Badge>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Economia Mensal</p>
                <p className="text-xl font-semibold text-[hsl(var(--brand))]">
                  {formatCurrency(results.monthlySavings)}
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Economia Anual</p>
                <p className="text-xl font-semibold text-[hsl(var(--brand-accent))]">
                  {formatCurrency(results.annualSavings)}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2 border-t">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">
                  Sistema Recomendado
                </p>
                <p className="font-medium">
                  {results.recommendedSystem.power.toFixed(2)} kWp
                </p>
                <p className="text-sm text-muted-foreground">
                  {results.recommendedSystem.panelCount} painéis solares
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">
                  Retorno do Investimento
                </p>
                <p className="font-medium">
                  {results.paybackPeriod.toFixed(1)} anos
                </p>
                <p className="text-sm text-muted-foreground">
                  Investimento:{' '}
                  {formatCurrency(results.recommendedSystem.estimatedCost)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t">
              <Badge variant="eco">Impacto Ambiental</Badge>
              <p className="text-sm">
                Redução de {Math.round(results.co2Reduction)} kg de CO₂ por ano
              </p>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button
          variant="solar"
          size="hero"
          onClick={calculateResults}
          disabled={loading}
          className="w-full"
        >
          {loading ? 'Calculando...' : 'Calcular Economia Solar'}
        </Button>
      </CardFooter>
    </Card>
  );
}
