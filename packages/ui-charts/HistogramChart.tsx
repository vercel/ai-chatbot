import React from 'react';

export function computeHistogram(
  data: number[],
  bins = Math.ceil(Math.sqrt(data.length))
) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const step = (max - min) / bins || 1;
  const counts = new Array(bins).fill(0);
  data.forEach((d) => {
    const idx = Math.min(Math.floor((d - min) / step), bins - 1);
    counts[idx]++;
  });
  return { counts, min, step };
}

export interface HistogramChartProps {
  data: number[];
  width: number;
  height: number;
  bins?: number;
}

const HistogramChart: React.FC<HistogramChartProps> = ({ data, width, height, bins }) => {
  const { counts } = computeHistogram(data, bins);
  const maxCount = Math.max(...counts, 0);
  const barWidth = width / counts.length;
  return (
    <svg width={width} height={height}>
      {counts.map((count, i) => {
        const barHeight = maxCount ? (count / maxCount) * height : 0;
        const key = `${i}-${count}`;
        return (
          <rect
            key={key}
            x={i * barWidth}
            y={height - barHeight}
            width={barWidth - 1}
            height={barHeight}
            fill="#3b82f6"
          />
        );
      })}
    </svg>
  );
};

export default React.memo(HistogramChart);
