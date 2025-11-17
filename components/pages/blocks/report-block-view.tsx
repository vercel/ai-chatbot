"use client";

import type { ReportBlockDraft } from "../types";

export type ReportBlockViewProps = {
  block: ReportBlockDraft;
};

export function ReportBlockView({ block }: ReportBlockViewProps) {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 text-sm text-muted-foreground">
      <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
        <span className="font-medium text-foreground">
          Report ID:{" "}
          <span className="font-mono">{block.reportId || "—"}</span>
        </span>
        <span>Chart: {block.display.chartType}</span>
      </div>

      {block.display.title ? (
        <div className="rounded-md border border-border/60 bg-muted/40 p-3 text-xs text-muted-foreground">
          Title: {block.display.title}
        </div>
      ) : null}

      <div className="flex flex-1 flex-col justify-center rounded-md border border-dashed border-border/60 bg-background p-4 text-center text-xs text-muted-foreground">
        Report visualizations will connect to the reporting engine in a future
        milestone. For now, this placeholder documents the block configuration.
      </div>
    </div>
  );
}

