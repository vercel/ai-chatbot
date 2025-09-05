import React from 'react';

export interface RadarChartProps {
  data: { label: string; value: number }[];
  width: number;
  height: number;
}

const RadarChart: React.FC<RadarChartProps> = ({ data, width, height }) => {
  const radius = Math.min(width, height) / 2;
  const centerX = width / 2;
  const centerY = height / 2;
  const angleStep = (Math.PI * 2) / data.length;
  const points = data
    .map((d, i) => {
      const angle = i * angleStep - Math.PI / 2;
      const r = d.value * radius;
      return `${centerX + r * Math.cos(angle)},${centerY + r * Math.sin(angle)}`;
    })
    .join(' ');
  return (
    <svg width={width} height={height}>
      <polygon points={points} fill="rgba(59,130,246,0.4)" stroke="#3b82f6" />
    </svg>
  );
};

export default React.memo(RadarChart);
