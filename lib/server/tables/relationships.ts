import { sql } from "drizzle-orm";
import type { DbClient } from "@/lib/server/tenant/context";
import type { RelationshipConfig } from "./schema";

export type ForeignKeyInfo = {
  constraint_name: string;
  table_name: string;
  column_name: string;
  foreign_table_name: string;
  foreign_column_name: string;
};

/**
 * Detects foreign key relationships from PostgreSQL metadata
 */
export async function detectForeignKeys(
  db: DbClient,
  tableName: string
): Promise<ForeignKeyInfo[]> {
  const result = await db.execute(sql`
    SELECT
      tc.constraint_name,
      tc.table_name,
      kcu.column_name,
      ccu.table_name AS foreign_table_name,
      ccu.column_name AS foreign_column_name
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema = 'public'
      AND tc.table_name = ${tableName}
    ORDER BY tc.constraint_name, kcu.ordinal_position
  `) as Array<{
    constraint_name: string;
    table_name: string;
    column_name: string;
    foreign_table_name: string;
    foreign_column_name: string;
  }>;

  return result.map((row) => ({
    constraint_name: row.constraint_name,
    table_name: row.table_name,
    column_name: row.column_name,
    foreign_table_name: row.foreign_table_name,
    foreign_column_name: row.foreign_column_name,
  }));
}

/**
 * Converts foreign key info to relationship config
 */
export function foreignKeyToRelationship(
  fk: ForeignKeyInfo
): RelationshipConfig {
  // Determine relationship type based on constraints (simplified - assumes one_to_many)
  return {
    table_name: fk.table_name,
    foreign_key_column: fk.column_name,
    referenced_table: fk.foreign_table_name,
    referenced_column: fk.foreign_column_name,
    relationship_type: "one_to_many",
  };
}

/**
 * Detects all relationships for a table and converts to relationship configs
 */
export async function detectTableRelationships(
  db: DbClient,
  tableName: string
): Promise<RelationshipConfig[]> {
  const foreignKeys = await detectForeignKeys(db, tableName);
  return foreignKeys.map(foreignKeyToRelationship);
}

/**
 * Detects reverse relationships (tables that reference this table)
 */
export async function detectReverseRelationships(
  db: DbClient,
  tableName: string
): Promise<RelationshipConfig[]> {
  const result = await db.execute(sql`
    SELECT
      tc.constraint_name,
      tc.table_name,
      kcu.column_name,
      ccu.table_name AS foreign_table_name,
      ccu.column_name AS foreign_column_name
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema = 'public'
      AND ccu.table_name = ${tableName}
    ORDER BY tc.constraint_name, kcu.ordinal_position
  `) as Array<{
    constraint_name: string;
    table_name: string;
    column_name: string;
    foreign_table_name: string;
    foreign_column_name: string;
  }>;

  return result.map((row) => ({
    table_name: row.table_name,
    foreign_key_column: row.column_name,
    referenced_table: row.foreign_table_name,
    referenced_column: row.foreign_column_name,
    relationship_type: "one_to_many",
  }));
}

