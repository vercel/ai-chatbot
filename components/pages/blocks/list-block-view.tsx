"use client";

import { useMemo } from "react";
import type { ListBlockDraft } from "../types";
import { useListBlockData } from "../hooks";

export type ListBlockViewProps = {
  block: ListBlockDraft;
  urlParams: Record<string, string>;
};

export function ListBlockView({ block, urlParams }: ListBlockViewProps) {
  const { data, isLoading, error } = useListBlockData(block, urlParams);

  const resolvedFilters = useMemo(
    () =>
      block.filters.map((filter) => ({
        ...filter,
        resolvedValue: resolveToken(filter.value, urlParams),
      })),
    [block.filters, urlParams]
  );

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
        <span className="font-medium text-foreground">
          Table: <span className="font-mono">{block.tableName || "—"}</span>
        </span>
        <span>Format: {block.display.format}</span>
        <span>Actions: {block.display.showActions ? "Enabled" : "Hidden"}</span>
        <span>Editable: {block.display.editable ? "Yes" : "No"}</span>
      </div>

      {block.display.columns.length > 0 ? (
        <div className="rounded-md border border-border/60 bg-muted/50 p-3 text-xs text-muted-foreground">
          Columns: {block.display.columns.join(", ")}
        </div>
      ) : null}

      <div className="rounded-md border border-dashed border-border/60 bg-background p-3 text-xs text-muted-foreground">
        <p className="font-semibold text-foreground">
          {data?.tableName ?? (block.tableName || "Preview")}
        </p>
        {isLoading ? (
          <p className="mt-1">Loading table rows…</p>
        ) : error ? (
          <p className="mt-1 text-red-600">{error}</p>
        ) : data ? (
          <div className="mt-3 overflow-auto rounded border border-border/50">
            <table className="min-w-full text-left text-xs text-foreground">
              <thead className="bg-muted/60">
                <tr>
                  {data.columns.map((column) => (
                    <th key={column} className="px-3 py-2 font-semibold">
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={Math.max(1, data.columns.length)}
                      className="px-3 py-3 text-center text-muted-foreground"
                    >
                      No rows found for the current filters.
                    </td>
                  </tr>
                ) : (
                  data.rows.map((row, index) => (
                    <tr
                      key={`row-${index.toString()}`}
                      className="even:bg-muted/40"
                    >
                      {data.columns.map((column) => {
                        const cell = (row as Record<string, unknown>)[column];
                        return (
                          <td key={column} className="px-3 py-2">
                            <CellValue value={cell} />
                          </td>
                        );
                      })}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-1">Table preview unavailable.</p>
        )}
      </div>

      <div>
        <h5 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Filters
        </h5>
        {resolvedFilters.length === 0 ? (
          <p className="mt-1 text-xs text-muted-foreground">No filters applied.</p>
        ) : (
          <ul className="mt-2 space-y-2 text-xs text-muted-foreground">
            {resolvedFilters.map((filter) => (
              <li
                key={filter.id}
                className="flex flex-wrap items-center gap-2 rounded-md border border-border/50 bg-muted/30 px-3 py-2"
              >
                <span className="font-mono text-foreground">{filter.column}</span>
                <span>{filter.operator}</span>
                <span className="font-mono text-foreground">{filter.value || "—"}</span>
                {filter.resolvedValue !== filter.value ? (
                  <span className="text-[10px] text-muted-foreground/80">
                    Resolved: {filter.resolvedValue ?? "—"}
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
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

function CellValue({ value }: { value: unknown }) {
  if (value === null || value === undefined) {
    return <span className="text-muted-foreground/70">—</span>;
  }
  if (typeof value === "object") {
    try {
      return (
        <code className="text-[11px]">
          {JSON.stringify(value, null, 0)}
        </code>
      );
    } catch {
      return <span>{String(value)}</span>;
    }
  }
  return <span>{String(value)}</span>;
}

