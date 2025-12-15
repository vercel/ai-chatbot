"use client";

import { useMemo } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type TimeSeriesDataPoint = {
  country: string;
  date: string;
  value: number | null;
};

export type TimeSeriesChartProps = {
  data: TimeSeriesDataPoint[];
  minValue: number;
  maxValue: number;
  title?: string;
  height?: number;
  showLegend?: boolean;
  showStats?: boolean;
  dateFormatter?: (date: string) => string;
};

// Color palette for multiple series
const DEFAULT_COLORS = [
  "hsl(var(--primary))",
  "hsl(217, 91%, 60%)", // Blue
  "hsl(142, 76%, 36%)", // Green
  "hsl(38, 92%, 50%)", // Orange
  "hsl(0, 84%, 60%)", // Red
  "hsl(280, 67%, 50%)", // Purple
  "hsl(199, 89%, 48%)", // Cyan
];

export function TimeSeriesChart({
  data,
  minValue,
  maxValue,
  title,
  height = 180,
  showLegend = true,
  showStats = true,
  dateFormatter = (date) => date.slice(-2),
}: TimeSeriesChartProps) {
  // Get unique countries
  const countries = useMemo(
    () => Array.from(new Set(data.map((d) => d.country))),
    [data]
  );

  // Transform data for multi-series line chart
  // Group by date and create an object with date and one property per country
  const chartData = useMemo(() => {
    if (data.length === 0) {
      return [];
    }

    // Get all unique dates, sorted
    const dates = Array.from(new Set(data.map((d) => d.date))).sort(
      (a, b) => Number.parseInt(a, 10) - Number.parseInt(b, 10)
    );

    // Create data points grouped by date
    return dates.map((date) => {
      const dataPoint: Record<string, string | number | null> = { date };
      // Add value for each country at this date
      for (const country of countries) {
        const point = data.find(
          (d) => d.date === date && d.country === country
        );
        dataPoint[country] = point?.value ?? null;
      }
      return dataPoint;
    });
  }, [data, countries]);

  const hasMultipleSeries = countries.length > 1;

  if (chartData.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center text-muted-foreground text-xs">
        No data to display
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {title && <div className="font-medium text-xs">{title}</div>}
      <ResponsiveContainer height={height} width="100%">
        <LineChart
          data={chartData}
          margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
          isAnimationActive={false}
        >
          <CartesianGrid
            opacity={0.3}
            stroke="hsl(var(--border))"
            strokeDasharray="3 3"
          />
          <XAxis
            dataKey="date"
            interval="preserveStartEnd"
            tick={{
              fontSize: 10,
              fill: "hsl(var(--muted-foreground))",
            }}
            tickFormatter={dateFormatter}
          />
          <YAxis
            domain={[minValue, maxValue]}
            tick={{
              fontSize: 10,
              fill: "hsl(var(--muted-foreground))",
            }}
            width={40}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--popover))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "6px",
              fontSize: "11px",
            }}
            formatter={(value, name) => {
              if (typeof value === "number") {
                return [value.toFixed(2), name as string];
              }
              return ["No data", name as string];
            }}
            labelStyle={{ color: "hsl(var(--popover-foreground))" }}
          />
          {hasMultipleSeries && showLegend && (
            <Legend
              iconType="line"
              wrapperStyle={{
                fontSize: "10px",
                paddingTop: "10px",
              }}
            />
          )}
          {countries.map((country, index) => (
            <Line
              key={country}
              type="monotone"
              dataKey={country}
              stroke={DEFAULT_COLORS[index % DEFAULT_COLORS.length]}
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
              connectNulls={false}
              isAnimationActive={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
      {showStats && (
        <div className="flex justify-between text-muted-foreground text-xs">
          <span>Min: {minValue.toFixed(2)}</span>
          <span>Max: {maxValue.toFixed(2)}</span>
          {hasMultipleSeries && <span>{countries.length} series</span>}
        </div>
      )}
    </div>
  );
}
