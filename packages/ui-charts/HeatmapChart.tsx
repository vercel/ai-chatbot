import React from 'react';

export interface HeatmapChartProps {
  data: number[][];
  width: number;
  height: number;
}

const HeatmapChart: React.FC<HeatmapChartProps> = ({ data, width, height }) => {
  const rows = data.length;
  const cols = data[0]?.length ?? 0;
  const flat = data.flat();
  const max = Math.max(...flat, 0);
  const cellWidth = width / cols;
  const cellHeight = height / rows;
  return (
    <svg width={width} height={height}>
      {data.map((row, y) =>
        row.map((value, x) => {
          const intensity = max ? value / max : 0;
          const color = `rgba(59,130,246,${intensity})`;
          const key = `${x}-${y}-${value}`;
          return (
            <rect
              key={key}
              x={x * cellWidth}
              y={y * cellHeight}
              width={cellWidth}
              height={cellHeight}
              fill={color}
            />
          );
        }),
      )}
    </svg>
  );
};

export default React.memo(HeatmapChart);
