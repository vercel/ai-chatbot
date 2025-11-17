"use client";

import { useMemo } from "react";
import type { RecordBlockDraft } from "../types";
import { useRecordBlockData } from "../hooks";

export type RecordBlockViewProps = {
  block: RecordBlockDraft;
  urlParams: Record<string, string>;
};

export function RecordBlockView({
  block,
  urlParams,
}: RecordBlockViewProps) {
  const { data, isLoading, error } = useRecordBlockData(block, urlParams);
  const resolvedRecordId = useMemo(
    () => resolveToken(block.recordId, urlParams),
    [block.recordId, urlParams]
  );

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 text-sm text-muted-foreground">
      <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
        <span className="font-medium text-foreground">
          Table: <span className="font-mono">{block.tableName || "—"}</span>
        </span>
        <span>Mode: {block.display.mode}</span>
        <span>Format: {block.display.format}</span>
      </div>

      <div className="rounded-md border border-border/60 bg-muted/50 p-3 text-xs text-muted-foreground">
        Record ID:{" "}
        <span className="font-mono text-foreground">{block.recordId || "—"}</span>
        {resolvedRecordId !== block.recordId ? (
          <span className="ml-2 text-muted-foreground/70">
            Resolved:{" "}
            <span className="font-mono text-foreground">
              {resolvedRecordId ?? "missing"}
            </span>
          </span>
        ) : null}
      </div>

      {block.display.columns.length > 0 ? (
        <div className="rounded-md border border-dashed border-border/60 bg-background p-3 text-xs text-muted-foreground">
          Columns: {block.display.columns.join(", ")}
        </div>
      ) : null}

      <div className="rounded-md border border-dashed border-border/50 bg-background p-3 text-xs text-muted-foreground">
        <p className="font-semibold text-foreground">
          {data?.tableName ?? (block.tableName || "Record preview")}
        </p>
        {isLoading ? (
          <p className="mt-1">Loading record…</p>
        ) : error ? (
          <p className="mt-1 text-red-600">{error}</p>
        ) : data?.record ? (
          <dl className="mt-3 grid gap-2">
            {data.columns.map((column) => (
              <div
                key={column}
                className="grid grid-cols-[120px,1fr] gap-3"
              >
                <dt className="font-medium text-foreground">{column}</dt>
                <dd className="font-mono text-muted-foreground">
                  <RecordValue value={data.record?.[column]} />
                </dd>
              </div>
            ))}
          </dl>
        ) : (
          <p className="mt-1">No record found for the provided identifier.</p>
        )}
      </div>
    </div>
  );
}

function resolveToken(
  value: string,
  urlParams: Record<string, string>
): string | null {
  if (!value || !value.startsWith("url.")) {
    return value;
  }
  const key = value.slice(4);
  return urlParams[key] ?? null;
}

function RecordValue({ value }: { value: unknown }) {
  if (value === null || value === undefined) {
    return "—";
  }
  if (typeof value === "object") {
    try {
      return JSON.stringify(value, null, 0);
    } catch {
      return String(value);
    }
  }
  return String(value);
}

