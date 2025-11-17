"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  ListBlockDraft,
  RecordBlockDraft,
  TriggerBlockDraft,
} from "./types";

export type ListBlockData = {
  columns: string[];
  rows: Array<Record<string, unknown>>;
  pagination: {
    page: number;
    limit: number;
    totalRows: number;
    totalPages: number;
  };
  tableName: string;
};

export type RecordBlockData = {
  columns: string[];
  record: Record<string, unknown> | null;
  tableName: string;
};

export function useListBlockData(
  block: ListBlockDraft,
  urlParams: Record<string, string>
) {
  const [data, setData] = useState<ListBlockData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [requestId, setRequestId] = useState(0);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    params.set("table", block.tableName);
    params.set("page", "1");
    params.set("limit", "100");

    block.filters.forEach((filter) => {
      if (!filter.column) {
        return;
      }
      if (filter.operator === "is_null" || filter.operator === "is_not_null") {
        params.set(`filter_op[${filter.column}]`, filter.operator);
        return;
      }

      const resolvedValue = resolveUrlValue(filter.value, urlParams);
      if (resolvedValue !== null && resolvedValue !== undefined && resolvedValue !== "") {
        params.set(`filter_op[${filter.column}]`, filter.operator);
        params.set(`filter[${filter.column}]`, resolvedValue);
      }
    });

    return params.toString();
  }, [block.filters, block.tableName, urlParams]);

  const fetchData = useCallback(
    async (signal?: AbortSignal) => {
      if (!block.tableName) {
        setData(null);
        setError("Table is not configured");
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/supabase/table?${queryString}`,
          {
            signal,
          }
        );

        if (!response.ok) {
          const payload = await safeJson(response);
          throw new Error(
            payload?.error ?? "Failed to load table data"
          );
        }

        const payload = (await response.json()) as ListBlockData;
        setData(payload);
      } catch (caught) {
        if ((caught as Error)?.name === "AbortError") {
          return;
        }
        setError(
          caught instanceof Error ? caught.message : "Unknown error"
        );
        setData(null);
      } finally {
        setIsLoading(false);
      }
    },
    [block.tableName, queryString]
  );

  useEffect(() => {
    const controller = new AbortController();
    fetchData(controller.signal);
    return () => controller.abort();
  }, [fetchData, requestId]);

  const reload = useCallback(() => {
    setRequestId((current) => current + 1);
  }, []);

  return {
    data,
    isLoading,
    error,
    reload,
  };
}

export function useRecordBlockData(
  block: RecordBlockDraft,
  urlParams: Record<string, string>
) {
  const [data, setData] = useState<RecordBlockData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [requestId, setRequestId] = useState(0);

  const { queryString, resolvedId } = useMemo(() => {
    const params = new URLSearchParams();
    params.set("table", block.tableName);
    params.set("idColumn", "id");
    const resolvedId = resolveUrlValue(block.recordId, urlParams);
    if (resolvedId) {
      params.set("id", resolvedId);
    }
    return { queryString: params.toString(), resolvedId };
  }, [block.recordId, block.tableName, urlParams]);

  const fetchData = useCallback(
    async (signal?: AbortSignal) => {
      if (!block.tableName) {
        setData(null);
        setError("Table is not configured");
        return;
      }
      if (!block.recordId || !resolvedId) {
        setData(null);
        setError("Record identifier is not available");
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/supabase/record?${queryString}`,
          { signal }
        );

        if (!response.ok) {
          const payload = await safeJson(response);
          throw new Error(
            payload?.error ?? "Failed to load record data"
          );
        }

        const payload = (await response.json()) as RecordBlockData;
        setData(payload);
      } catch (caught) {
        if ((caught as Error)?.name === "AbortError") {
          return;
        }
        setError(
          caught instanceof Error ? caught.message : "Unknown error"
        );
        setData(null);
      } finally {
        setIsLoading(false);
      }
    },
    [block.recordId, block.tableName, queryString]
  );

  useEffect(() => {
    const controller = new AbortController();
    fetchData(controller.signal);
    return () => controller.abort();
  }, [fetchData, requestId]);

  const reload = useCallback(() => {
    setRequestId((current) => current + 1);
  }, []);

  return {
    data,
    isLoading,
    error,
    reload,
  };
}

export function useTriggerBlockAction(_block: TriggerBlockDraft) {
  const [status, setStatus] = useState<
    "idle" | "pending" | "success" | "error"
  >("idle");
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async () => {
    setStatus("pending");
    setError(null);
    try {
      // Hook execution will be supplied by the trigger system integration.
      await Promise.resolve();
      setStatus("success");
    } catch (caught) {
      setStatus("error");
      setError(
        caught instanceof Error ? caught.message : "Trigger failed"
      );
    }
  }, []);

  return {
    execute,
    status,
    error,
  };
}

function resolveUrlValue(
  value: string,
  urlParams: Record<string, string>
): string | null {
  if (!value) {
    return value;
  }
  if (!value.startsWith("url.")) {
    return value;
  }
  const key = value.slice(4);
  return urlParams[key] ?? null;
}

async function safeJson(response: Response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

