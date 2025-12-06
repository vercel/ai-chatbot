"use client";

import cx from "classnames";
import { useMemo, useState } from "react";

type IndicatorDataPoint = {
  country: string;
  date: string;
  value: number;
  claim_id: string;
};

type Indicator = {
  indicator_id: string;
  indicator_name: string;
  data: IndicatorDataPoint[];
};

type Data360Output = {
  data: Indicator[];
  note?: Record<string, string>;
};

const ChartIcon = ({ size = 24 }: { size?: number }) => (
  <svg fill="none" height={size} viewBox="0 0 24 24" width={size}>
    <path
      d="M3 3v18h18"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
    />
    <path
      d="M7 16l4-4 4 4 6-6"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
    />
  </svg>
);

export function Data360({ output }: { output: Data360Output }) {
  const [selectedIndicatorIndex, setSelectedIndicatorIndex] = useState(0);

  const selectedIndicator = useMemo(
    () => output.data[selectedIndicatorIndex],
    [output.data, selectedIndicatorIndex]
  );

  if (!output.data || output.data.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-background p-4 text-muted-foreground text-sm">
        No data available
      </div>
    );
  }

  // Sort data points by date for better visualization
  const sortedData = useMemo(() => {
    if (!selectedIndicator?.data) return [];
    return [...selectedIndicator.data].sort(
      (a, b) => Number.parseInt(a.date) - Number.parseInt(b.date)
    );
  }, [selectedIndicator]);

  const minValue = useMemo(
    () =>
      sortedData.length > 0 ? Math.min(...sortedData.map((d) => d.value)) : 0,
    [sortedData]
  );
  const maxValue = useMemo(
    () =>
      sortedData.length > 0 ? Math.max(...sortedData.map((d) => d.value)) : 0,
    [sortedData]
  );
  const valueRange = maxValue - minValue || 1;

  // Get unique countries
  const countries = useMemo(
    () => Array.from(new Set(sortedData.map((d) => d.country))),
    [sortedData]
  );

  return (
    <div className="flex w-full flex-col gap-4 overflow-hidden rounded-2xl border border-border bg-background p-4 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="text-muted-foreground">
            <ChartIcon size={20} />
          </div>
          <div className="font-semibold text-sm">
            World Development Indicators
          </div>
        </div>
        {output.data.length > 1 && (
          <div className="text-muted-foreground text-xs">
            {output.data.length} indicators
          </div>
        )}
      </div>

      {/* Indicator Selector */}
      {output.data.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {output.data.map((indicator, index) => (
            <button
              className={cx(
                "whitespace-nowrap rounded-lg border px-3 py-1.5 text-xs transition-colors",
                {
                  "border-primary bg-primary/10 text-primary":
                    index === selectedIndicatorIndex,
                  "border-border bg-background text-muted-foreground hover:bg-muted":
                    index !== selectedIndicatorIndex,
                }
              )}
              key={indicator.indicator_id}
              onClick={() => setSelectedIndicatorIndex(index)}
              type="button"
            >
              {indicator.indicator_name.length > 40
                ? `${indicator.indicator_name.slice(0, 40)}...`
                : indicator.indicator_name}
            </button>
          ))}
        </div>
      )}

      {/* Selected Indicator Info */}
      {selectedIndicator && (
        <>
          <div className="rounded-lg border border-border bg-muted/30 p-3">
            <div className="mb-2 font-medium text-sm">
              {selectedIndicator.indicator_name}
            </div>
            <div className="text-muted-foreground text-xs">
              Indicator ID: {selectedIndicator.indicator_id}
            </div>
          </div>

          {/* Data Visualization */}
          {sortedData.length > 0 && (
            <div className="flex flex-col gap-4">
              {/* Summary Stats */}
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-lg border border-border bg-muted/30 p-2">
                  <div className="text-muted-foreground text-xs">
                    Data Points
                  </div>
                  <div className="font-semibold text-sm">
                    {sortedData.length}
                  </div>
                </div>
                <div className="rounded-lg border border-border bg-muted/30 p-2">
                  <div className="text-muted-foreground text-xs">Countries</div>
                  <div className="font-semibold text-sm">
                    {countries.length}
                  </div>
                </div>
                <div className="rounded-lg border border-border bg-muted/30 p-2">
                  <div className="text-muted-foreground text-xs">Years</div>
                  <div className="font-semibold text-sm">
                    {sortedData.length > 0
                      ? `${sortedData[0].date} - ${sortedData[sortedData.length - 1].date}`
                      : "-"}
                  </div>
                </div>
              </div>

              {/* Simple Bar Chart */}
              <div className="rounded-lg border border-border bg-muted/30 p-3">
                <div className="mb-2 font-medium text-xs">Value Over Time</div>
                <div
                  className="flex items-end gap-1"
                  style={{ height: "120px" }}
                >
                  {sortedData.map((point, index) => {
                    const height =
                      ((point.value - minValue) / valueRange) * 100;
                    return (
                      <div
                        className="flex flex-1 flex-col items-center gap-1"
                        key={`${point.date}-${point.country}-${index}`}
                      >
                        <div
                          className="w-full rounded-t bg-primary transition-all hover:bg-primary/80"
                          style={{ height: `${Math.max(height, 2)}%` }}
                          title={`${point.date}: ${point.value.toFixed(2)}`}
                        />
                        <div className="text-[10px] text-muted-foreground">
                          {point.date.slice(-2)}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-2 flex justify-between text-muted-foreground text-xs">
                  <span>Min: {minValue.toFixed(2)}</span>
                  <span>Max: {maxValue.toFixed(2)}</span>
                </div>
              </div>

              {/* Data Table */}
              <div className="rounded-lg border border-border bg-muted/30">
                <div className="max-h-64 overflow-auto">
                  <table className="w-full text-xs">
                    <thead className="sticky top-0 bg-muted">
                      <tr>
                        <th className="border-border border-b px-3 py-2 text-left font-medium">
                          Country
                        </th>
                        <th className="border-border border-b px-3 py-2 text-left font-medium">
                          Date
                        </th>
                        <th className="border-border border-b px-3 py-2 text-right font-medium">
                          Value
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedData.map((point, index) => (
                        <tr
                          className="hover:bg-muted/50"
                          key={`${point.country}-${point.date}-${index}`}
                        >
                          <td className="px-3 py-2">{point.country}</td>
                          <td className="px-3 py-2">{point.date}</td>
                          <td className="px-3 py-2 text-right font-medium">
                            {point.value.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Notes */}
      {output.note && Object.keys(output.note).length > 0 && (
        <div className="rounded-lg border border-border bg-muted/30 p-2">
          <div className="text-muted-foreground text-xs">
            {Object.entries(output.note)
              .filter(([, value]) => value)
              .map(([key, value]) => (
                <div key={key}>
                  <span className="font-medium">{key}:</span> {value}
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
