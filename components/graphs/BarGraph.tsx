'use client';

import { Card } from '@/components/ui/card';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { chartConfig } from '@/lib/chart-config';
import chartColors from './ChartColors.module.css';

interface DataPoint {
  name: string;
  value: number;
}

interface BarGraphResult {
  data: DataPoint[];
  title?: string;
}

interface BarGraphProps {
  result?: BarGraphResult;
}

const DEFAULT_DATA: DataPoint[] = [
  { name: 'Product A', value: 400 },
  { name: 'Product B', value: 300 },
  { name: 'Product C', value: 200 },
  { name: 'Product D', value: 500 },
  { name: 'Product E', value: 350 },
];

export function BarGraph({ result }: BarGraphProps) {
  const { color, height } = chartConfig.barChart;
  const { data = DEFAULT_DATA, title = 'Sample Bar Chart' } = result || {};

  return (
    <Card className={`p-4 ${chartColors.chartColors}`}>
      {title && (
        <h3 className="text-lg font-semibold mb-4 text-foreground">{title}</h3>
      )}
      <div style={{ width: '100%', height }}>
        <ResponsiveContainer>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="name"
              className="text-sm text-muted-foreground"
              tick={{ fill: 'currentColor' }}
            />
            <YAxis
              className="text-sm text-muted-foreground"
              tick={{ fill: 'currentColor' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '0.5rem',
              }}
            />
            <Bar
              dataKey="value"
              fill="var(--color-bar)"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
} 