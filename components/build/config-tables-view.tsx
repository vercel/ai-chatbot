"use client";

import useSWR from "swr";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

type TableInfo = {
  schema: string;
  name: string;
  type: string;
};

type TablesResponse = {
  tables: TableInfo[];
};

const fetcher = async (url: string): Promise<TableInfo[]> => {
  const response = await fetch(url, {
    credentials: "same-origin",
  });

  if (!response.ok) {
    throw new Error("Failed to load tables");
  }

  const payload = (await response.json()) as TablesResponse;
  return payload.tables;
};

export function ConfigTablesView() {
  const { data: tables, error, isLoading } = useSWR<TableInfo[]>(
    "/api/tables?type=config",
    fetcher
  );

  if (error) {
    return (
      <div className="rounded-md border border-dashed border-border/60 p-8 text-center text-sm text-destructive">
        <p className="font-semibold">Failed to load config tables</p>
        <p className="text-muted-foreground mt-1">{error.message}</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="rounded-md border border-dashed border-border/60 bg-muted/50 p-3">
        <Skeleton className="h-6 w-32 mb-4" />
        <div className="overflow-auto rounded border border-border/50">
          <table className="min-w-full text-left text-xs">
            <thead className="bg-muted/60">
              <tr>
                <th className="px-3 py-2 font-semibold">
                  <Skeleton className="h-4 w-24" />
                </th>
                <th className="px-3 py-2 font-semibold">
                  <Skeleton className="h-4 w-24" />
                </th>
                <th className="px-3 py-2 font-semibold">
                  <Skeleton className="h-4 w-24" />
                </th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="even:bg-muted/40">
                  <td className="px-3 py-2">
                    <Skeleton className="h-4 w-32" />
                  </td>
                  <td className="px-3 py-2">
                    <Skeleton className="h-4 w-24" />
                  </td>
                  <td className="px-3 py-2">
                    <Skeleton className="h-4 w-20" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (!tables || tables.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-border/60 bg-background p-3 text-xs text-muted-foreground">
        <div className="text-center py-12">
          <Sparkles className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="font-semibold text-foreground mb-2">No config tables found</p>
          <p>Workspace configuration tables will appear here.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
        <span className="font-medium text-foreground">
          Tables: <span className="font-mono">{tables.length}</span>
        </span>
        <span>Type: Config tables</span>
      </div>

      <div className="rounded-md border border-dashed border-border/60 bg-background p-3 text-xs text-foreground">
        <p className="font-semibold mb-3">Config Tables</p>
        <div className="mt-3 overflow-auto rounded border border-border/50">
          <table className="min-w-full text-left text-xs text-foreground">
            <thead className="bg-muted/60">
              <tr>
                <th className="px-3 py-2 font-semibold">Table Name</th>
                <th className="px-3 py-2 font-semibold">Schema</th>
                <th className="px-3 py-2 font-semibold">Type</th>
              </tr>
            </thead>
            <tbody>
              {tables.map((table) => (
                <tr
                  key={table.name}
                  className="even:bg-muted/40 hover:bg-accent cursor-pointer transition-colors"
                >
                  <td className="px-3 py-2">
                    <Link
                      href={`/build/config/${table.name}`}
                      className="font-mono text-foreground hover:underline"
                    >
                      {table.name}
                    </Link>
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">{table.schema}</td>
                  <td className="px-3 py-2 text-muted-foreground">{table.type}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

