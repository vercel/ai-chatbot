import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { resolveTenantContext } from "@/lib/server/tenant/context";
import { requireCapability } from "@/lib/server/tenant/permissions";
import { getResourceStore } from "@/lib/server/tenant/resource-store";
import {
  getTableConfig,
  TableNotFoundError,
} from "@/lib/server/tables";
import {
  buildSelectQuery,
  executeSelectQuery,
  getRecordById,
  countRecords,
  type QueryOptions,
} from "@/lib/server/tables/query-builder";

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

export async function GET(
  request: Request,
  { params }: { params: Promise<{ tableName: string }> }
) {
  try {
    const tenant = await resolveTenantContext();
    requireCapability(tenant, "data.view");

    const { tableName } = await params;
    const url = new URL(request.url);
    const recordId = url.searchParams.get("id");

    // Get table config
    const tableConfig = await getTableConfig(tenant, tableName);
    if (!tableConfig) {
      return NextResponse.json(
        { error: "Table configuration not found" },
        { status: 404 }
      );
    }

    const store = await getResourceStore(tenant);

    try {
      // If recordId is provided, get single record
      if (recordId) {
        const record = await store.withSqlClient(async (db) => {
          return getRecordById(
            db,
            tenant,
            tableConfig,
            tableName,
            recordId,
            true
          );
        });

        if (!record) {
          return NextResponse.json(
            { error: "Record not found" },
            { status: 404 }
          );
        }

        return NextResponse.json({ record });
      }

      // Otherwise, list records
      const limit = Number.parseInt(url.searchParams.get("limit") ?? "100", 10);
      const offset = Number.parseInt(url.searchParams.get("offset") ?? "0", 10);
      const orderBy = url.searchParams.get("orderBy") ?? undefined;
      const orderDirection =
        (url.searchParams.get("orderDirection") as "asc" | "desc") ?? "asc";
      const includeLabels =
        url.searchParams.get("includeLabels") !== "false";

      // Parse filters from query params
      const filters: Record<string, unknown> = {};
      for (const [key, value] of url.searchParams.entries()) {
        if (
          !["limit", "offset", "orderBy", "orderDirection", "includeLabels"].includes(
            key
          )
        ) {
          filters[key] = value;
        }
      }

      const options: QueryOptions = {
        limit,
        offset,
        orderBy,
        orderDirection,
        filters,
        includeLabels,
      };

      const { records, total } = await store.withSqlClient(async (db) => {
        const { query } = await buildSelectQuery(
          db,
          tenant,
          tableConfig,
          tableName,
          options
        );

        const records = await executeSelectQuery(db, query);
        const total = await countRecords(db, tableName, filters);

        return { records, total };
      });

      return NextResponse.json({
        records,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total,
        },
      });
    } finally {
      await store.dispose();
    }
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ tableName: string }> }
) {
  try {
    const tenant = await resolveTenantContext();
    requireCapability(tenant, "data.create");

    const { tableName } = await params;
    const body = await request.json();

    const tableConfig = await getTableConfig(tenant, tableName);
    if (!tableConfig) {
      return NextResponse.json(
        { error: "Table configuration not found" },
        { status: 404 }
      );
    }

    const store = await getResourceStore(tenant);

    try {
      const record = await store.withSqlClient(async (db) => {
        const escapedTableName = escapeIdentifier(tableName);
        const columns: string[] = [];
        const values: string[] = [];

        for (const [key, value] of Object.entries(body)) {
          columns.push(escapeIdentifier(key));
          if (value === null) {
            values.push("NULL");
          } else if (typeof value === "string") {
            values.push(escapeString(value));
          } else {
            values.push(String(value));
          }
        }

        const columnsList = columns.join(", ");
        const valuesList = values.join(", ");

        const insertQuery = `
          INSERT INTO ${escapedTableName} (${columnsList})
          VALUES (${valuesList})
          RETURNING *
        `.trim();

        const result = await db.execute(sql.raw(insertQuery));
        return (result as Record<string, unknown>[])[0];
      });

      return NextResponse.json({ record }, { status: 201 });
    } finally {
      await store.dispose();
    }
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ tableName: string }> }
) {
  try {
    const tenant = await resolveTenantContext();
    requireCapability(tenant, "data.edit");

    const { tableName } = await params;
    const url = new URL(request.url);
    const recordId = url.searchParams.get("id");

    if (!recordId) {
      return NextResponse.json(
        { error: "Record ID is required" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const tableConfig = await getTableConfig(tenant, tableName);
    if (!tableConfig) {
      return NextResponse.json(
        { error: "Table configuration not found" },
        { status: 404 }
      );
    }

    const primaryKeyColumn =
      tableConfig.config.primary_key_column ?? "id";
    const store = await getResourceStore(tenant);

    try {
      const record = await store.withSqlClient(async (db) => {
        const escapedTableName = escapeIdentifier(tableName);
        const escapedPkColumn = escapeIdentifier(primaryKeyColumn);
        const escapedPkValue =
          typeof recordId === "string"
            ? escapeString(recordId)
            : String(recordId);

        const updates: string[] = [];

        for (const [key, value] of Object.entries(body)) {
          const escapedKey = escapeIdentifier(key);
          if (value === null) {
            updates.push(`${escapedKey} = NULL`);
          } else if (typeof value === "string") {
            updates.push(`${escapedKey} = ${escapeString(value)}`);
          } else {
            updates.push(`${escapedKey} = ${value}`);
          }
        }

        if (updates.length === 0) {
          throw new Error("No fields to update");
        }

        const updateQuery = `
          UPDATE ${escapedTableName}
          SET ${updates.join(", ")}
          WHERE ${escapedPkColumn} = ${escapedPkValue}
          RETURNING *
        `.trim();

        const result = await db.execute(sql.raw(updateQuery));
        return (result as Record<string, unknown>[])[0];
      });

      if (!record) {
        return NextResponse.json(
          { error: "Record not found" },
          { status: 404 }
        );
      }

      return NextResponse.json({ record });
    } finally {
      await store.dispose();
    }
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ tableName: string }> }
) {
  try {
    const tenant = await resolveTenantContext();
    requireCapability(tenant, "data.delete");

    const { tableName } = await params;
    const url = new URL(request.url);
    const recordId = url.searchParams.get("id");

    if (!recordId) {
      return NextResponse.json(
        { error: "Record ID is required" },
        { status: 400 }
      );
    }

    const tableConfig = await getTableConfig(tenant, tableName);
    if (!tableConfig) {
      return NextResponse.json(
        { error: "Table configuration not found" },
        { status: 404 }
      );
    }

    const primaryKeyColumn =
      tableConfig.config.primary_key_column ?? "id";
    const store = await getResourceStore(tenant);

    try {
      await store.withSqlClient(async (db) => {
        const escapedTableName = escapeIdentifier(tableName);
        const escapedPkColumn = escapeIdentifier(primaryKeyColumn);
        const escapedPkValue =
          typeof recordId === "string"
            ? escapeString(recordId)
            : String(recordId);

        const deleteQuery = `
          DELETE FROM ${escapedTableName}
          WHERE ${escapedPkColumn} = ${escapedPkValue}
        `.trim();

        await db.execute(sql.raw(deleteQuery));
      });

      return NextResponse.json({ success: true });
    } finally {
      await store.dispose();
    }
  } catch (error) {
    return handleError(error);
  }
}

function handleError(error: unknown) {
  if (error instanceof TableNotFoundError) {
    return NextResponse.json({ error: "Table not found" }, { status: 404 });
  }

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

