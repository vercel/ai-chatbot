import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { resolveTenantContext } from "@/lib/server/tenant/context";
import { requireCapability } from "@/lib/server/tenant/permissions";
import { getResourceStore } from "@/lib/server/tenant/resource-store";

const SYSTEM_TABLES = new Set([
  "users",
  "workspaces",
  "roles",
  "teams",
  "workspace_users",
  "workspace_invites",
  "workspace_apps",
  "pages",
  "chats",
  "messages",
  "votes",
  "documents",
  "suggestions",
  "streams",
  // PostgreSQL system tables
  "pg_stat_statements",
  "pg_stat_activity",
  "pg_stat_database",
  "pg_stat_user_tables",
  "pg_stat_user_indexes",
  "pg_stat_user_functions",
  "pg_stat_archiver",
  "pg_stat_bgwriter",
  "pg_stat_replication",
  "pg_stat_subscription",
  "pg_stat_wal_receiver",
  "pg_stat_progress_vacuum",
  "pg_stat_progress_cluster",
  "pg_stat_progress_create_index",
  "pg_stat_progress_analyze",
  "pg_stat_progress_basebackup",
  "pg_stat_progress_copy",
  "pg_stat_slru",
  "pg_stat_io",
  "pg_stat_recovery_prefetch",
  "pg_stat_checkpointer",
  "pg_stat_database_conflicts",
  "pg_stat_xact_user_tables",
  "pg_stat_xact_user_functions",
  "pg_stat_xact_all_tables",
  "pg_stat_xact_all_functions",
  "pg_stat_user_tables",
  "pg_stat_user_indexes",
  "pg_stat_user_functions",
  "pg_stat_archiver",
  "pg_stat_bgwriter",
  "pg_stat_replication",
  "pg_stat_subscription",
  "pg_stat_wal_receiver",
  "pg_stat_progress_vacuum",
  "pg_stat_progress_cluster",
  "pg_stat_progress_create_index",
  "pg_stat_progress_analyze",
  "pg_stat_progress_basebackup",
  "pg_stat_progress_copy",
  "pg_stat_slru",
  "pg_stat_io",
  "pg_stat_recovery_prefetch",
  "pg_stat_checkpointer",
  "pg_stat_database_conflicts",
  "pg_stat_xact_user_tables",
  "pg_stat_xact_user_functions",
  "pg_stat_xact_all_tables",
  "pg_stat_xact_all_functions",
]);

export async function GET(request: Request) {
  try {
    const tenant = await resolveTenantContext();
    requireCapability(tenant, "pages.view");

    const url = new URL(request.url);
    const type = url.searchParams.get("type") ?? "data"; // "data" or "config"

    const store = await getResourceStore(tenant);

    try {
      const tables = await store.withSqlClient(async (db) => {
        // Drizzle's execute() returns an array directly for postgres-js
        const rows = await db.execute(sql`
          SELECT 
            table_schema,
            table_name,
            table_type
          FROM information_schema.tables
          WHERE table_schema = 'public'
            AND table_type = 'BASE TABLE'
          ORDER BY table_name
        `) as Array<{
          table_schema: string;
          table_name: string;
          table_type: string;
        }>;

        return rows.map((row) => ({
          schema: row.table_schema,
          name: row.table_name,
          type: row.table_type,
        }));
      });

      const filtered = tables.filter((table) => {
        const isSystemTable = SYSTEM_TABLES.has(table.name);
        return type === "data" ? !isSystemTable : isSystemTable;
      });

      return NextResponse.json({ tables: filtered });
    } finally {
      await store.dispose();
    }
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Forbidden") {
        return NextResponse.json(
          { error: "Forbidden" },
          { status: 403 }
        );
      }
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "Unknown error" },
      { status: 500 }
    );
  }
}

