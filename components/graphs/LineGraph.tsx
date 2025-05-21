'use client';

import { Card } from '@/components/ui/card';
import {
  LineChart,
  Line,
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

interface LineGraphResult {
  data: DataPoint[];
  title?: string;
}

interface LineGraphProps {
  result?: LineGraphResult;
}

const DEFAULT_DATA: DataPoint[] = [
  { name: 'Jan', value: 100 },
  { name: 'Feb', value: 200 },
  { name: 'Mar', value: 150 },
  { name: 'Apr', value: 300 },
  { name: 'May', value: 250 },
  { name: 'Jun', value: 400 },
];

export function LineGraph({ result }: LineGraphProps) {
  const { color, height } = chartConfig.lineChart;
  const { data = DEFAULT_DATA, title = 'Sample Line Chart' } = result || {};

  return (
    <Card className={`p-4 ${chartColors.chartColors}`}>
      {title && (
        <h3 className="text-lg font-semibold mb-4 text-foreground">{title}</h3>
      )}
      <div style={{ width: '100%', height }}>
        <ResponsiveContainer>
          <LineChart data={data}>
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
            <Line
              type="monotone"
              dataKey="value"
              stroke="var(--color-bar)"
              strokeWidth={2}
              dot={{ fill: 'var(--color-bar)' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
} 