'use client';

import { memo } from 'react';
import { Chart } from '@/components/ui/chart';

export type ChartType = 'bar' | 'line';

export interface ChartData {
  name: string;
  value: number;
}

interface ChartProps {
  type: ChartType;
  data: ChartData[];
  height?: number;
  barWidth?: number;
  barGap?: number;
  color?: string;
  className?: string;
}

function PureChart({
  type,
  data,
  height = 200,
  barWidth = 40,
  barGap = 8,
  color,
  className = '',
}: ChartProps) {
  return (
    <Chart
      type={type}
      data={data}
      height={height}
      barWidth={barWidth}
      barGap={barGap}
      color={color}
      className={className}
    />
  );
}

export const ChartComponent = memo(PureChart); 