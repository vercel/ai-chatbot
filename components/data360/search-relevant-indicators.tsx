"use client";

import { SearchIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import type { SearchRelevantIndicatorsOutput } from "./types";

const SearchIconComponent = () => (
  <SearchIcon className="size-5 text-muted-foreground" />
);

export function SearchRelevantIndicators({
  output,
}: {
  output: SearchRelevantIndicatorsOutput;
}) {
  if (!output.indicators || output.indicators.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-background p-4 text-muted-foreground text-sm">
        No indicators found
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-4 overflow-hidden rounded-2xl border border-border bg-background p-4 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SearchIconComponent />
          <div className="font-semibold text-sm">Search Results</div>
        </div>
        <div className="text-muted-foreground text-xs">
          {output.indicators.length} indicator
          {output.indicators.length !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Horizontal Scrollable Cards */}
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex w-max gap-3 pb-4">
          {output.indicators.map((indicator, index) => (
            <Card
              className="min-w-[280px] max-w-[320px] shrink-0 border-border transition-colors hover:border-primary/50"
              key={`${indicator.idno}-${index}`}
            >
              <CardHeader className="pb-3">
                <CardTitle className="line-clamp-2 font-medium text-sm leading-tight">
                  {indicator.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex flex-col gap-2">
                  <div className="text-muted-foreground text-xs">
                    <span className="font-medium">ID:</span> {indicator.idno}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      {/* Note */}
      {output.note && (
        <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-3 dark:border-amber-800 dark:bg-amber-950/20">
          <div className="flex items-start gap-2">
            <div className="mt-0.5 text-amber-600 dark:text-amber-400">
              <svg
                fill="none"
                height="16"
                viewBox="0 0 24 24"
                width="16"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 16V12M12 8H12.01M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                />
              </svg>
            </div>
            <div className="text-amber-800 text-xs leading-relaxed dark:text-amber-200">
              {output.note}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
