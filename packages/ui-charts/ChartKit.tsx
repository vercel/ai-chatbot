import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import RadarChart from './RadarChart';
import WaterfallChart from './WaterfallChart';
import HeatmapChart from './HeatmapChart';
import LoadCurveChart from './LoadCurveChart';
import HistogramChart from './HistogramChart';

export type ChartType = 'radar' | 'waterfall' | 'heatmap' | 'load-curve' | 'histogram';

export interface ChartKitProps {
  type: ChartType;
  data: unknown;
  width?: number;
  height?: number;
  ariaLabel: string;
}

export interface ChartKitHandle {
  exportToPNG: () => Promise<string | undefined>;
}

const ChartKit = forwardRef<ChartKitHandle, ChartKitProps>((props, ref) => {
  const { type, data, width = 300, height = 300, ariaLabel } = props;
  const containerRef = useRef<HTMLDivElement>(null);

  const exportToPNG = async () => {
    if (!containerRef.current) return undefined;
    const { toPng } = await import('html-to-image');
    return toPng(containerRef.current);
  };

  useImperativeHandle(ref, () => ({ exportToPNG }));

  let chart: React.ReactNode = null;
  switch (type) {
    case 'radar':
      chart = (
        <RadarChart data={data as any} width={width} height={height} />
      );
      break;
    case 'waterfall':
      chart = (
        <WaterfallChart data={data as any} width={width} height={height} />
      );
      break;
    case 'heatmap':
      chart = (
        <HeatmapChart data={data as any} width={width} height={height} />
      );
      break;
    case 'load-curve':
      chart = (
        <LoadCurveChart data={data as any} width={width} height={height} />
      );
      break;
    case 'histogram':
      chart = (
        <HistogramChart data={data as any} width={width} height={height} />
      );
      break;
    default:
      chart = null;
  }

  return (
    <div
      ref={containerRef}
      style={{ width, height }}
      role="img"
      aria-label={ariaLabel}
    >
      {chart}
    </div>
  );
});

export default React.memo(ChartKit);
