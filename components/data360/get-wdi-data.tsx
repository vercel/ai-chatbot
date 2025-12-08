"use client";

import cx from "classnames";
import { useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TimeSeriesChart } from "./charts";
import type { Data360Output } from "./types";

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

export function GetWdiData({ output }: { output: Data360Output }) {
  const [selectedIndicatorIndex, setSelectedIndicatorIndex] = useState(0);
  const [viewMode, setViewMode] = useState<"single" | "compare">("single");

  const selectedIndicator = useMemo(
    () => output.data?.[selectedIndicatorIndex],
    [output.data, selectedIndicatorIndex]
  );

  // Get all unique countries across all indicators
  const allCountries = useMemo(() => {
    const countrySet = new Set<string>();
    if (output.data) {
      for (const indicator of output.data) {
        if (indicator.data) {
          for (const point of indicator.data) {
            if (point.country) {
              countrySet.add(point.country);
            }
          }
        }
      }
    }
    return Array.from(countrySet);
  }, [output.data]);

  // Get all unique dates across selected indicators (for future use)
  // const allDates = useMemo(() => {
  //   const dateSet = new Set<string>();
  //   if (viewMode === "compare" && output.data) {
  //     for (const indicator of output.data) {
  //       if (indicator.data) {
  //         for (const point of indicator.data) {
  //           if (point.date) {
  //             dateSet.add(point.date);
  //           }
  //         }
  //       }
  //     }
  //   } else if (selectedIndicator?.data) {
  //     for (const point of selectedIndicator.data) {
  //       if (point.date) {
  //         dateSet.add(point.date);
  //       }
  //     }
  //   }
  //   return Array.from(dateSet).sort(
  //     (a, b) => Number.parseInt(a, 10) - Number.parseInt(b, 10)
  //   );
  // }, [output.data, selectedIndicator, viewMode]);

  // Sort data points by date for better visualization
  const sortedData = useMemo(() => {
    if (!selectedIndicator?.data) {
      return [];
    }
    return [...selectedIndicator.data]
      .filter((d) => d.value !== null && d.value !== undefined)
      .sort(
        (a, b) => Number.parseInt(a.date, 10) - Number.parseInt(b.date, 10)
      );
  }, [selectedIndicator]);

  // Get data for comparison mode
  const comparisonData = useMemo(() => {
    if (viewMode !== "compare" || !output.data) {
      return [];
    }
    return output.data.map((indicator) => ({
      indicator,
      data: [...(indicator.data || [])]
        .filter((d) => d.value !== null && d.value !== undefined)
        .sort(
          (a, b) => Number.parseInt(a.date, 10) - Number.parseInt(b.date, 10)
        ),
    }));
  }, [output.data, viewMode]);

  const minValue = useMemo(() => {
    if (viewMode === "compare") {
      const allValues = comparisonData.flatMap((cd) =>
        cd.data.map((d) => d.value).filter((v): v is number => v !== null)
      );
      return allValues.length > 0 ? Math.min(...allValues) : 0;
    }
    const values = sortedData
      .map((d) => d.value)
      .filter((v): v is number => v !== null);
    return values.length > 0 ? Math.min(...values) : 0;
  }, [sortedData, comparisonData, viewMode]);

  const maxValue = useMemo(() => {
    if (viewMode === "compare") {
      const allValues = comparisonData.flatMap((cd) =>
        cd.data.map((d) => d.value).filter((v): v is number => v !== null)
      );
      return allValues.length > 0 ? Math.max(...allValues) : 0;
    }
    const values = sortedData
      .map((d) => d.value)
      .filter((v): v is number => v !== null);
    return values.length > 0 ? Math.max(...values) : 0;
  }, [sortedData, comparisonData, viewMode]);

  // Get unique countries for selected indicator
  const countries = useMemo(
    () => Array.from(new Set(sortedData.map((d) => d.country))),
    [sortedData]
  );

  const hasMultipleIndicators = (output.data?.length ?? 0) > 1;
  const hasMultipleCountries = allCountries.length > 1;

  // Count total data points across all indicators
  const totalDataPoints = useMemo(() => {
    if (!output.data) {
      return 0;
    }
    return output.data.reduce(
      (total, indicator) => total + (indicator.data?.length ?? 0),
      0
    );
  }, [output.data]);

  // Check if there's only one data point total
  const hasSingleDataPoint = totalDataPoints === 1;

  if (!output.data || output.data.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-background p-4 text-muted-foreground text-sm">
        No data available
      </div>
    );
  }

  // Render simple data card if there's only one data point
  if (hasSingleDataPoint) {
    const singleIndicator = output.data[0];
    const singleDataPoint = singleIndicator.data?.[0];

    if (!singleDataPoint) {
      return (
        <div className="rounded-lg border border-border bg-background p-4 text-muted-foreground text-sm">
          No data available
        </div>
      );
    }

    return (
      <Card className="w-full border-border shadow-sm">
        <CardHeader className="border-border border-b pb-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <ChartIcon size={18} />
              <span className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
                World Development Indicator
              </span>
            </div>
            <CardTitle className="font-semibold text-xl leading-snug">
              {singleIndicator.indicator_name}
            </CardTitle>
            <CardDescription>
              <span className="font-mono text-muted-foreground text-xs">
                {singleIndicator.indicator_id}
              </span>
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-5 pt-6">
          {/* Value Display */}
          <div className="rounded-lg border border-border bg-muted/30 p-6">
            <div className="mb-2 font-medium text-muted-foreground text-xs uppercase tracking-wide">
              Value
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-semibold text-3xl text-foreground">
                {singleDataPoint.value !== null
                  ? singleDataPoint.value.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })
                  : "N/A"}
              </span>
              {singleDataPoint.value !== null && (
                <span className="text-muted-foreground text-sm">units</span>
              )}
            </div>
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg border border-border bg-background p-4">
              <div className="mb-2 font-medium text-muted-foreground text-xs uppercase tracking-wide">
                Country
              </div>
              <div className="font-semibold text-foreground text-sm">
                {singleDataPoint.country}
              </div>
            </div>

            <div className="rounded-lg border border-border bg-background p-4">
              <div className="mb-2 font-medium text-muted-foreground text-xs uppercase tracking-wide">
                Date
              </div>
              <div className="font-semibold text-foreground text-sm">
                {singleDataPoint.date}
              </div>
            </div>
          </div>

          {/* Notes Section */}
          {output.note &&
          Object.keys(output.note).length > 0 &&
          Object.values(output.note).some((value) => value !== "") ? (
            <div className="rounded-lg border border-border bg-muted/20 p-4">
              <div className="mb-3 font-medium text-muted-foreground text-xs uppercase tracking-wide">
                Notes
              </div>
              <div className="space-y-2 text-muted-foreground text-sm">
                {Object.entries(output.note)
                  .filter(([, value]) => value)
                  .map(([key, value]) => (
                    <div className="flex gap-3" key={key}>
                      <span className="font-medium text-foreground">
                        {key}:
                      </span>
                      <span className="flex-1">{value}</span>
                    </div>
                  ))}
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    );
  }

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
        <div className="flex items-center gap-3">
          {hasMultipleCountries && (
            <div className="text-muted-foreground text-xs">
              {allCountries.length} countr
              {allCountries.length !== 1 ? "ies" : "y"}
            </div>
          )}
          {hasMultipleIndicators && (
            <div className="text-muted-foreground text-xs">
              {output.data.length} indicators
            </div>
          )}
        </div>
      </div>

      {/* View Mode Toggle (only show if multiple indicators) */}
      {hasMultipleIndicators && (
        <div className="flex gap-2 rounded-lg border border-border bg-muted/30 p-1">
          <button
            className={cx(
              "flex-1 rounded-md px-3 py-1.5 text-xs transition-colors",
              {
                "bg-background font-medium shadow-sm": viewMode === "single",
                "text-muted-foreground hover:text-foreground":
                  viewMode !== "single",
              }
            )}
            onClick={() => setViewMode("single")}
            type="button"
          >
            Single View
          </button>
          <button
            className={cx(
              "flex-1 rounded-md px-3 py-1.5 text-xs transition-colors",
              {
                "bg-background font-medium shadow-sm": viewMode === "compare",
                "text-muted-foreground hover:text-foreground":
                  viewMode !== "compare",
              }
            )}
            onClick={() => setViewMode("compare")}
            type="button"
          >
            Compare All
          </button>
        </div>
      )}

      {/* Indicator Selector (only in single view) */}
      {hasMultipleIndicators && viewMode === "single" && (
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

      {/* Single View */}
      {viewMode === "single" && selectedIndicator && (
        <>
          <div className="rounded-lg border border-border bg-muted/30 p-3">
            <div className="mb-2 font-medium text-sm">
              {selectedIndicator.indicator_name}
            </div>
            <div className="flex flex-wrap gap-2 text-muted-foreground text-xs">
              <span>ID: {selectedIndicator.indicator_id}</span>
              {hasMultipleCountries && (
                <span>• Countries: {countries.join(", ")}</span>
              )}
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
                      ? `${sortedData[0].date} - ${sortedData.at(-1)?.date ?? ""}`
                      : "-"}
                  </div>
                </div>
              </div>

              {/* Time Series Line Chart */}
              <div className="rounded-lg border border-border bg-muted/30 p-3">
                <TimeSeriesChart
                  data={sortedData.map((point) => ({
                    country: point.country,
                    date: point.date,
                    value: point.value,
                  }))}
                  dateFormatter={(date) => date.slice(-2)}
                  height={180}
                  maxValue={maxValue}
                  minValue={minValue}
                  showLegend={countries.length > 1}
                  showStats
                  title="Value Over Time"
                />
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
                            {point.value !== null ? (
                              point.value.toFixed(2)
                            ) : (
                              <span className="text-muted-foreground">
                                No data
                              </span>
                            )}
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

      {/* Compare View */}
      {viewMode === "compare" && (
        <div className="flex flex-col gap-4">
          {comparisonData.map(({ indicator, data: indicatorData }) => {
            const indicatorMin =
              indicatorData.length > 0
                ? Math.min(
                    ...indicatorData
                      .map((d) => d.value)
                      .filter((v): v is number => v !== null)
                  )
                : 0;
            const indicatorMax =
              indicatorData.length > 0
                ? Math.max(
                    ...indicatorData
                      .map((d) => d.value)
                      .filter((v): v is number => v !== null)
                  )
                : 0;
            const indicatorRange = indicatorMax - indicatorMin || 1;

            return (
              <div
                className="rounded-lg border border-border bg-muted/30 p-4"
                key={indicator.indicator_id}
              >
                <div className="mb-3">
                  <div className="mb-1 font-medium text-sm">
                    {indicator.indicator_name}
                  </div>
                  <div className="text-muted-foreground text-xs">
                    {indicator.indicator_id}
                  </div>
                </div>

                {indicatorData.length > 0 && (
                  <div className="space-y-3">
                    {/* Mini Chart */}
                    <div className="rounded border border-border bg-background p-2">
                      <div className="mb-1 font-medium text-xs">Trend</div>
                      <div
                        className="flex items-end gap-0.5"
                        style={{ height: "80px" }}
                      >
                        {indicatorData.map((point, pointIdx) => {
                          const height =
                            point.value !== null
                              ? ((point.value - indicatorMin) /
                                  indicatorRange) *
                                100
                              : 0;
                          return (
                            <div
                              className="flex flex-1 flex-col items-center gap-0.5"
                              key={`${point.date}-${pointIdx}`}
                            >
                              <div
                                className="w-full rounded-t bg-primary/70 transition-all hover:bg-primary"
                                style={{
                                  height: `${Math.max(height, point.value === null ? 0 : 2)}%`,
                                }}
                                title={
                                  point.value !== null
                                    ? `${point.date}: ${point.value.toFixed(2)}`
                                    : `${point.date}: No data`
                                }
                              />
                              <div className="text-[9px] text-muted-foreground">
                                {point.date.slice(-2)}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
                        <span>Min: {indicatorMin.toFixed(2)}</span>
                        <span>Max: {indicatorMax.toFixed(2)}</span>
                      </div>
                    </div>

                    {/* Summary */}
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="rounded border border-border bg-background p-1.5">
                        <div className="text-[10px] text-muted-foreground">
                          Points
                        </div>
                        <div className="font-semibold text-xs">
                          {indicatorData.length}
                        </div>
                      </div>
                      <div className="rounded border border-border bg-background p-1.5">
                        <div className="text-[10px] text-muted-foreground">
                          Latest
                        </div>
                        <div className="font-semibold text-xs">
                          {(() => {
                            const lastValue = indicatorData.at(-1)?.value;
                            return lastValue !== null && lastValue !== undefined
                              ? lastValue.toFixed(2)
                              : "N/A";
                          })()}
                        </div>
                      </div>
                      <div className="rounded border border-border bg-background p-1.5">
                        <div className="text-[10px] text-muted-foreground">
                          Range
                        </div>
                        <div className="font-semibold text-xs">
                          {indicatorData.length > 0
                            ? `${indicatorData[0].date}-${indicatorData.at(-1)?.date ?? ""}`
                            : "-"}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Notes
      The note contains a key and a value. The key is the name of the note and the value is the value of the note. If the value is empty for all keys, then don't show the note section.
      */}
      {output.note &&
      Object.keys(output.note).length > 0 &&
      Object.values(output.note).some((value) => value !== "") ? (
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
      ) : null}
    </div>
  );
}
