import React from 'react';

export interface LoadCurvePoint {
  x: number;
  y: number;
}

export interface LoadCurveChartProps {
  data: LoadCurvePoint[];
  width: number;
  height: number;
}

const LoadCurveChart: React.FC<LoadCurveChartProps> = ({ data, width, height }) => {
  const xs = data.map((d) => d.x);
  const ys = data.map((d) => d.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const maxY = Math.max(...ys, 0);
  const path = data
    .map((d, i) => {
      const x = ((d.x - minX) / (maxX - minX || 1)) * width;
      const y = height - (d.y / (maxY || 1)) * height;
      return `${i === 0 ? 'M' : 'L'}${x},${y}`;
    })
    .join(' ');
  return (
    <svg width={width} height={height}>
      <path d={path} fill="none" stroke="#3b82f6" strokeWidth={2} />
    </svg>
  );
};

export default React.memo(LoadCurveChart);
