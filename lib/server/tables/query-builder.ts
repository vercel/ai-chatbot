import { sql } from "drizzle-orm";
import type { DbClient } from "@/lib/server/tenant/context";
import type { TableRecord } from "./schema";
import { resolveLabelField } from "./labels";
import type { TenantContext } from "@/lib/server/tenant/context";

export type QueryOptions = {
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDirection?: "asc" | "desc";
  filters?: Record<string, unknown>;
  includeLabels?: boolean;
};

type JoinInfo = {
  alias: string;
  table: string;
  condition: string;
  labelField: string;
  fkColumn: string;
};

/**
 * Escapes SQL identifiers
 */
function escapeIdentifier(identifier: string): string {
  return `"${identifier.replace(/"/g, '""')}"`;
}

/**
 * Escapes SQL string literals
 */
function escapeString(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}

/**
 * Builds WHERE clause from filters
 */
function buildWhereClause(
  filters: Record<string, unknown>,
  tableAlias: string
): string {
  const conditions: string[] = [];

  for (const [key, value] of Object.entries(filters)) {
    const escapedKey = escapeIdentifier(key);
    const escapedTableAlias = escapeIdentifier(tableAlias);

    if (value === null) {
      conditions.push(`${escapedTableAlias}.${escapedKey} IS NULL`);
    } else if (Array.isArray(value)) {
      const values = value
        .map((v) => (typeof v === "string" ? escapeString(v) : String(v)))
        .join(", ");
      conditions.push(`${escapedTableAlias}.${escapedKey} IN (${values})`);
    } else if (typeof value === "string") {
      conditions.push(
        `${escapedTableAlias}.${escapedKey} = ${escapeString(value)}`
      );
    } else {
      conditions.push(`${escapedTableAlias}.${escapedKey} = ${value}`);
    }
  }

  return conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
}

/**
 * Builds ORDER BY clause
 */
function buildOrderByClause(
  orderBy: string | undefined,
  orderDirection: "asc" | "desc" = "asc",
  tableAlias: string
): string {
  if (!orderBy) {
    return "";
  }

  const escapedOrderBy = escapeIdentifier(orderBy);
  const escapedTableAlias = escapeIdentifier(tableAlias);
  const direction = orderDirection.toUpperCase();

  return `ORDER BY ${escapedTableAlias}.${escapedOrderBy} ${direction}`;
}

/**
 * Builds SELECT query with label field joins
 */
export async function buildSelectQuery(
  db: DbClient,
  tenant: TenantContext,
  tableConfig: TableRecord,
  tableName: string,
  options: QueryOptions = {}
): Promise<{
  query: string;
  joins: JoinInfo[];
}> {
  const {
    limit = 100,
    offset = 0,
    orderBy,
    orderDirection = "asc",
    filters = {},
    includeLabels = true,
  } = options;

  const mainTableAlias = "t";
  const escapedTableName = escapeIdentifier(tableName);
  const escapedMainAlias = escapeIdentifier(mainTableAlias);

  // Get all columns from the table
  const columnsResult = await db.execute(sql`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = ${tableName}
    ORDER BY ordinal_position
  `) as Array<{ column_name: string }>;

  const columns = columnsResult.map((row) => row.column_name);
  let selectColumns = columns
    .map((col) => `${escapedMainAlias}.${escapeIdentifier(col)}`)
    .join(", ");

  const joins: JoinInfo[] = [];
  let joinClauses = "";

  // Add label field joins if requested
  if (includeLabels) {
    const relationships = tableConfig.config.relationships ?? [];

    for (const relationship of relationships) {
      const labelInfo = await resolveLabelField(
        tenant,
        tableConfig,
        relationship.foreign_key_column
      );

      if (labelInfo) {
        const joinAlias = `label_${relationship.foreign_key_column}`;
        const escapedJoinAlias = escapeIdentifier(joinAlias);
        const escapedRefTable = escapeIdentifier(labelInfo.referencedTable);
        const escapedFkColumn = escapeIdentifier(relationship.foreign_key_column);
        const escapedRefColumn = escapeIdentifier(relationship.referenced_column);
        const escapedLabelField = escapeIdentifier(labelInfo.labelField);

        joinClauses += `\nLEFT JOIN ${escapedRefTable} AS ${escapedJoinAlias} ON ${escapedMainAlias}.${escapedFkColumn} = ${escapedJoinAlias}.${escapedRefColumn}`;

        joins.push({
          alias: joinAlias,
          table: labelInfo.referencedTable,
          condition: `${escapedMainAlias}.${escapedFkColumn} = ${escapedJoinAlias}.${escapedRefColumn}`,
          labelField: labelInfo.labelField,
          fkColumn: relationship.foreign_key_column,
        });

        // Add label field to SELECT
        selectColumns += `, ${escapedJoinAlias}.${escapedLabelField} AS ${escapeIdentifier(`${relationship.foreign_key_column}_label`)}`;
      }
    }
  }

  const whereClause = buildWhereClause(filters, mainTableAlias);
  const orderByClause = buildOrderByClause(orderBy, orderDirection, mainTableAlias);

  const query = `
    SELECT ${selectColumns}
    FROM ${escapedTableName} AS ${escapedMainAlias}
    ${joinClauses}
    ${whereClause}
    ${orderByClause}
    LIMIT ${limit}
    OFFSET ${offset}
  `.trim();

  return { query, joins };
}

/**
 * Executes a select query and returns results
 */
export async function executeSelectQuery(
  db: DbClient,
  query: string
): Promise<Record<string, unknown>[]> {
  const result = await db.execute(sql.raw(query));
  return result as Record<string, unknown>[];
}

/**
 * Gets a single record by ID
 */
export async function getRecordById(
  db: DbClient,
  tenant: TenantContext,
  tableConfig: TableRecord,
  tableName: string,
  recordId: string,
  includeLabels = true
): Promise<Record<string, unknown> | null> {
  const primaryKeyColumn = tableConfig.config.primary_key_column ?? "id";
  const { query } = await buildSelectQuery(
    db,
    tenant,
    tableConfig,
    tableName,
    {
      filters: { [primaryKeyColumn]: recordId },
      limit: 1,
      includeLabels,
    }
  );

  const results = await executeSelectQuery(db, query);
  return results[0] ?? null;
}

/**
 * Counts total records matching filters
 */
export async function countRecords(
  db: DbClient,
  tableName: string,
  filters: Record<string, unknown> = {}
): Promise<number> {
  const escapedTableName = escapeIdentifier(tableName);
  const whereClause = buildWhereClause(filters, "t");

  const query = `
    SELECT COUNT(*) as count
    FROM ${escapedTableName} AS t
    ${whereClause}
  `.trim();

  const result = await db.execute(sql.raw(query)) as Array<{ count: string }>;
  return Number.parseInt(result[0]?.count ?? "0", 10);
}

