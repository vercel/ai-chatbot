import { createClient } from "@/lib/supabase/server";
import type { TenantContext } from "@/lib/server/tenant/context";
import {
  createTableSchema,
  tableIdSchema,
  tableRecordSchema,
  updateTableSchema,
  type TableRecord,
  type UpdateTableInput,
} from "./schema";

export class TableNotFoundError extends Error {
  constructor(message = "Table not found") {
    super(message);
    this.name = "TableNotFoundError";
  }
}

type RawTableRow = Record<string, unknown>;

async function getSupabaseClient() {
  return createClient();
}

function parseJsonValue<T>(value: unknown, fallback: T): T {
  if (value === null || value === undefined) {
    return fallback;
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return parsed as T;
    } catch {
      return fallback;
    }
  }

  return value as T;
}

function coerceDateString(value: unknown): string {
  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === "string") {
    return value;
  }

  throw new Error("Expected timestamp string");
}

function normalizeTableRow(row: RawTableRow): TableRecord {
  const parsed = tableRecordSchema.safeParse({
    ...row,
    config: parseJsonValue(row.config, {}),
    created_at: coerceDateString(row.created_at),
    updated_at: coerceDateString(row.updated_at),
  });

  if (!parsed.success) {
    const issues = parsed.error.issues.map((issue) => issue.message).join(", ");
    throw new Error(`Invalid table payload from database: ${issues}`);
  }

  return parsed.data;
}

export async function listTableConfigs(
  tenant: TenantContext
): Promise<TableRecord[]> {
  const supabase = await getSupabaseClient();
  const { data, error } = await supabase
    .from("tables")
    .select("*")
    .eq("workspace_id", tenant.workspaceId)
    .order("name", { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch tables: ${error.message}`);
  }

  return (data ?? []).map((row) => normalizeTableRow(row as RawTableRow));
}

export async function getTableConfig(
  tenant: TenantContext,
  tableId: string
): Promise<TableRecord | null> {
  const id = tableIdSchema.parse(tableId);
  const supabase = await getSupabaseClient();
  const { data, error } = await supabase
    .from("tables")
    .select("*")
    .eq("workspace_id", tenant.workspaceId)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch table: ${error.message}`);
  }

  if (!data) {
    return null;
  }

  return normalizeTableRow(data as RawTableRow);
}

export async function createTableConfig(
  tenant: TenantContext,
  payload: unknown
): Promise<TableRecord> {
  const input = createTableSchema.parse(payload);
  const supabase = await getSupabaseClient();

  const { data, error } = await supabase
    .from("tables")
    .insert({
      id: input.id,
      workspace_id: tenant.workspaceId,
      name: input.name,
      description: input.description ?? null,
      config: input.config ?? {},
      created_by: tenant.userId,
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(`Failed to create table: ${error.message}`);
  }

  return normalizeTableRow(data as RawTableRow);
}

export async function updateTableConfig(
  tenant: TenantContext,
  tableId: string,
  payload: unknown
): Promise<TableRecord> {
  const id = tableIdSchema.parse(tableId);
  const input: UpdateTableInput = updateTableSchema.parse(payload);
  const targetId = input.id ?? id;

  const supabase = await getSupabaseClient();
  const { data, error } = await supabase
    .from("tables")
    .update({
      id: targetId,
      name: input.name,
      description:
        input.description === undefined ? undefined : input.description,
      config: input.config ?? {},
      updated_at: new Date().toISOString(),
    })
    .eq("workspace_id", tenant.workspaceId)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    if ("code" in error && error.code === "PGRST116") {
      throw new TableNotFoundError();
    }
    throw new Error(`Failed to update table: ${error.message}`);
  }

  return normalizeTableRow(data as RawTableRow);
}

export async function deleteTableConfig(
  tenant: TenantContext,
  tableId: string
): Promise<void> {
  const id = tableIdSchema.parse(tableId);
  const supabase = await getSupabaseClient();
  const { error } = await supabase
    .from("tables")
    .delete()
    .eq("workspace_id", tenant.workspaceId)
    .eq("id", id);

  if (error) {
    if ("code" in error && error.code === "PGRST116") {
      throw new TableNotFoundError();
    }
    throw new Error(`Failed to delete table: ${error.message}`);
  }
}

