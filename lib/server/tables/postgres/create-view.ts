import { sql } from "drizzle-orm";
import type { DbClient } from "@/lib/server/tenant/context";
import type { VersioningConfig, FieldMetadata } from "../schema";

/**
 * Escapes SQL identifiers to prevent injection
 */
function escapeIdentifier(identifier: string): string {
  return `"${identifier.replace(/"/g, '""')}"`;
}

/**
 * Creates a PostgreSQL view for versioning/SKU pattern
 */
export async function createPostgresView(
  db: DbClient,
  viewName: string,
  config: VersioningConfig,
  typeSpecificColumns: string[] = []
): Promise<void> {
  const { base_table, object_type, type_specific_columns = [] } = config;
  const escapedViewName = escapeIdentifier(viewName);
  const escapedBaseTable = escapeIdentifier(base_table);

  // Get all columns from base table
  const baseColumnsResult = await db.execute(sql`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = ${base_table}
    ORDER BY ordinal_position
  `) as Array<{ column_name: string }>;

  const baseColumns = baseColumnsResult.map((row) => row.column_name);

  // Combine base columns with type-specific columns
  const allColumns = [
    ...baseColumns,
    ...typeSpecificColumns,
    ...typeSpecificColumns.filter((col) => !baseColumns.includes(col)),
  ];

  // Filter columns if type_specific_columns is specified
  const columnsToInclude =
    type_specific_columns.length > 0
      ? [...baseColumns, ...type_specific_columns]
      : allColumns;

  const columnList = columnsToInclude
    .map((col) => `${escapedBaseTable}.${escapeIdentifier(col)}`)
    .join(", ");

  // Create view with optional type filter
  let viewDefinition = `CREATE OR REPLACE VIEW ${escapedViewName} AS\n`;
  viewDefinition += `SELECT ${columnList}\n`;
  viewDefinition += `FROM ${escapedBaseTable}`;

  // If base table has a type column, filter by object_type
  if (baseColumns.includes("type") || baseColumns.includes("object_type")) {
    const typeColumn = baseColumns.includes("type") ? "type" : "object_type";
    viewDefinition += `\nWHERE ${escapeIdentifier(typeColumn)} = ${sql.raw(`'${object_type}'`)}`;
  }

  viewDefinition += ";";

  await db.execute(sql.raw(viewDefinition));
}

/**
 * Drops a PostgreSQL view
 */
export async function dropPostgresView(
  db: DbClient,
  viewName: string,
  cascade = false
): Promise<void> {
  const escapedViewName = escapeIdentifier(viewName);
  const cascadeClause = cascade ? " CASCADE" : "";
  const ddl = `DROP VIEW IF EXISTS ${escapedViewName}${cascadeClause};`;
  await db.execute(sql.raw(ddl));
}

/**
 * Checks if a view exists
 */
export async function viewExists(
  db: DbClient,
  viewName: string
): Promise<boolean> {
  const result = await db.execute(sql`
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.views
      WHERE table_schema = 'public'
        AND table_name = ${viewName}
    )
  `) as Array<{ exists: boolean }>;

  return result[0]?.exists ?? false;
}

