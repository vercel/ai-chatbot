import { sql } from "drizzle-orm";
import type { DbClient } from "@/lib/server/tenant/context";
import type { TableConfig, FieldMetadata } from "../schema";

export type ColumnDefinition = {
  name: string;
  type: string;
  nullable?: boolean;
  default?: string;
  primaryKey?: boolean;
  unique?: boolean;
};

export type CreateTableOptions = {
  tableName: string;
  columns: ColumnDefinition[];
  primaryKey?: string | string[];
  indexes?: Array<{
    columns: string[];
    unique?: boolean;
    name?: string;
  }>;
};

/**
 * Escapes SQL identifiers to prevent injection
 */
function escapeIdentifier(identifier: string): string {
  return `"${identifier.replace(/"/g, '""')}"`;
}

/**
 * Maps field metadata to PostgreSQL column type
 */
function mapColumnType(field: FieldMetadata): string {
  const dataType = field.data_type?.toLowerCase() ?? "text";

  switch (dataType) {
    case "uuid":
      return "uuid";
    case "integer":
    case "int":
      return "integer";
    case "bigint":
      return "bigint";
    case "boolean":
    case "bool":
      return "boolean";
    case "timestamp":
    case "timestamptz":
      return "timestamp with time zone";
    case "date":
      return "date";
    case "numeric":
    case "decimal":
      return "numeric";
    case "json":
      return "json";
    case "jsonb":
      return "jsonb";
    case "text":
    default:
      return "text";
  }
}

/**
 * Generates CREATE TABLE DDL statement
 */
export function generateCreateTableDDL(options: CreateTableOptions): string {
  const { tableName, columns, primaryKey, indexes = [] } = options;
  const escapedTableName = escapeIdentifier(tableName);

  const columnDefinitions = columns.map((col) => {
    const escapedName = escapeIdentifier(col.name);
    let def = `${escapedName} ${col.type}`;

    if (!col.nullable) {
      def += " NOT NULL";
    }

    if (col.default !== undefined) {
      def += ` DEFAULT ${col.default}`;
    }

    if (col.unique) {
      def += " UNIQUE";
    }

    return def;
  });

  let ddl = `CREATE TABLE IF NOT EXISTS ${escapedTableName} (\n`;
  ddl += `  ${columnDefinitions.join(",\n  ")}`;

  if (primaryKey) {
    const pkColumns = Array.isArray(primaryKey)
      ? primaryKey.map(escapeIdentifier).join(", ")
      : escapeIdentifier(primaryKey);
    ddl += `,\n  CONSTRAINT ${escapedTableName}_pkey PRIMARY KEY (${pkColumns})`;
  }

  ddl += "\n);";

  // Add indexes
  for (const index of indexes) {
    const indexName = index.name
      ? escapeIdentifier(index.name)
      : `${escapedTableName}_${index.columns.join("_")}_idx`;
    const indexColumns = index.columns.map(escapeIdentifier).join(", ");
    const uniqueClause = index.unique ? "UNIQUE " : "";
    ddl += `\nCREATE INDEX IF NOT EXISTS ${indexName} ON ${escapedTableName} ${uniqueClause}(${indexColumns});`;
  }

  return ddl;
}

/**
 * Creates a PostgreSQL table from table configuration
 */
export async function createPostgresTable(
  db: DbClient,
  tableName: string,
  config: TableConfig,
  fieldMetadata: FieldMetadata[]
): Promise<void> {
  const primaryKeyColumn = config.primary_key_column ?? "id";

  // Ensure id column exists if using default primary key
  const hasIdColumn = fieldMetadata.some((f) => f.field_name === primaryKeyColumn);
  const columns: ColumnDefinition[] = [];

  if (!hasIdColumn && primaryKeyColumn === "id") {
    columns.push({
      name: "id",
      type: "uuid",
      nullable: false,
      default: "gen_random_uuid()",
      primaryKey: true,
    });
  }

  // Add columns from field metadata
  for (const field of fieldMetadata) {
    if (field.field_name === primaryKeyColumn && hasIdColumn) {
      columns.push({
        name: field.field_name,
        type: mapColumnType(field),
        nullable: !field.is_required,
        default: field.default_value
          ? String(field.default_value)
          : undefined,
        primaryKey: true,
        unique: field.is_unique,
      });
    } else {
      columns.push({
        name: field.field_name,
        type: mapColumnType(field),
        nullable: !field.is_required,
        default: field.default_value
          ? String(field.default_value)
          : undefined,
        unique: field.is_unique,
      });
    }
  }

  const primaryKey = columns.find((c) => c.primaryKey)
    ? primaryKeyColumn
    : undefined;

  const ddl = generateCreateTableDDL({
    tableName,
    columns,
    primaryKey,
    indexes: config.indexes,
  });

  await db.execute(sql.raw(ddl));
}

/**
 * Drops a PostgreSQL table
 */
export async function dropPostgresTable(
  db: DbClient,
  tableName: string,
  cascade = false
): Promise<void> {
  const escapedTableName = escapeIdentifier(tableName);
  const cascadeClause = cascade ? " CASCADE" : "";
  const ddl = `DROP TABLE IF EXISTS ${escapedTableName}${cascadeClause};`;
  await db.execute(sql.raw(ddl));
}

