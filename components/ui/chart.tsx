'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface ChartProps extends React.HTMLAttributes<HTMLDivElement> {
  data: Array<{
    name: string;
    value: number;
  }>;
  type?: 'bar' | 'line';
  maxValue?: number;
  height?: number;
  barWidth?: number;
  barGap?: number;
  color?: string;
}

const Chart = React.forwardRef<HTMLDivElement, ChartProps>(
  (
    {
      data,
      type = 'bar',
      maxValue,
      height = 200,
      barWidth = 40,
      barGap = 8,
      color = 'hsl(var(--primary))',
      className,
      ...props
    },
    ref
  ) => {
    const max = maxValue ?? Math.max(...data.map((d) => d.value));
    const min = 0;

    return (
      <div
        ref={ref}
        className={cn('relative w-full', className)}
        style={{ height }}
        {...props}
      >
        <div className="absolute inset-0 flex items-end justify-between">
          {data.map((item, index) => {
            const percentage = ((item.value - min) / (max - min)) * 100;
            return (
              <div
                key={item.name}
                className="flex flex-col items-center gap-2"
                style={{ width: barWidth }}
              >
                {type === 'bar' ? (
                  <div
                    className="w-full rounded-t-sm transition-all"
                    style={{
                      height: `${percentage}%`,
                      backgroundColor: color,
                    }}
                  />
                ) : (
                  <div
                    className="absolute bottom-0 w-1 rounded-full transition-all"
                    style={{
                      height: `${percentage}%`,
                      backgroundColor: color,
                      left: `${index * (barWidth + barGap)}px`,
                    }}
                  />
                )}
                <span className="text-xs text-muted-foreground">
                  {item.name}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
);

Chart.displayName = 'Chart';

export { Chart }; 