import React from 'react';

export interface WaterfallChartProps {
  data: { label: string; value: number }[];
  width: number;
  height: number;
}

const WaterfallChart: React.FC<WaterfallChartProps> = ({ data, width, height }) => {
  const cumulative: number[] = [];
  data.reduce((acc, d) => {
    const next = acc + d.value;
    cumulative.push(next);
    return next;
  }, 0);
  const maxVal = Math.max(...cumulative, 0);
  const barWidth = width / data.length;
  return (
    <svg width={width} height={height}>
      {data.map((d, i) => {
        const start = i === 0 ? 0 : cumulative[i - 1];
        const end = cumulative[i];
        const y = height - (Math.max(start, end) / maxVal) * height;
        const barHeight = (Math.abs(end - start) / maxVal) * height;
        const x = i * barWidth;
        return (
          <rect
            key={d.label}
            x={x}
            y={y}
            width={barWidth - 2}
            height={barHeight}
            fill={d.value >= 0 ? '#16a34a' : '#dc2626'}
          />
        );
      })}
    </svg>
  );
};

export default React.memo(WaterfallChart);
