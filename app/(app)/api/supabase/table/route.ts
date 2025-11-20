import { NextResponse } from "next/server";
import { ZodError, z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { resolveTenantContext } from "@/lib/server/tenant/context";
import { requireCapability } from "@/lib/server/tenant/permissions";
import type { PostgrestFilterBuilder } from "@supabase/postgrest-js";

const COLUMN_NAME_REGEX = /^[a-zA-Z0-9_]+$/;
const TABLE_NAME_REGEX = /^[a-zA-Z0-9_]+$/;

const querySchema = z.object({
  table: z
    .string()
    .min(1, "Table name is required")
    .regex(TABLE_NAME_REGEX, "Table name must be alphanumeric or underscore"),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(1000).default(100),
  filters: z
    .array(
      z.object({
        column: z
          .string()
          .min(1)
          .regex(COLUMN_NAME_REGEX, "Invalid column name"),
        operator: z.enum([
          "equals",
          "not_equals",
          "contains",
          "greater_than",
          "less_than",
          "greater_than_or_equal",
          "less_than_or_equal",
          "is_null",
          "is_not_null",
        ]),
        value: z.string().nullable(),
      })
    )
    .default([]),
});

export async function GET(request: Request) {
  try {
    const tenant = await resolveTenantContext();
    requireCapability(tenant, "pages.view");
    const url = new URL(request.url);
    const parsedQuery = parseQuery(url.searchParams);
    const validated = querySchema.parse(parsedQuery);
    const supabase = await createClient();

    let query = supabase
      .from(validated.table)
      .select("*", { count: "exact" });

    validated.filters.forEach((filter) => {
      query = applyFilter(query, filter.column, filter.operator, filter.value);
    });

    const start = (validated.page - 1) * validated.limit;
    const end = start + validated.limit - 1;

    const { data, error, count } = await query.range(start, end);

    if (error) {
      throw new Error(error.message);
    }

    const rows = data ?? [];
    const columns =
      rows.length > 0 ? Object.keys(rows[0] as Record<string, unknown>) : [];

    return NextResponse.json({
      tableName: validated.table,
      columns,
      rows,
      pagination: {
        page: validated.page,
        limit: validated.limit,
        totalRows: count ?? rows.length,
        totalPages:
          validated.limit === 0
            ? 0
            : Math.max(
                1,
                Math.ceil((count ?? rows.length) / validated.limit)
              ),
      },
    });
  } catch (error) {
    return handleError(error);
  }
}

function parseQuery(searchParams: URLSearchParams) {
  const table = searchParams.get("table") ?? "";
  const page = searchParams.get("page") ?? undefined;
  const limit = searchParams.get("limit") ?? undefined;

  const filterOperators = new Map<string, string>();
  const filterValues = new Map<string, string | null>();

  for (const [key, value] of searchParams.entries()) {
    const operatorMatch = /^filter_op\[(.+)]$/.exec(key);
    const valueMatch = /^filter\[(.+)]$/.exec(key);

    if (operatorMatch?.[1]) {
      filterOperators.set(operatorMatch[1], value);
    } else if (valueMatch?.[1]) {
      filterValues.set(valueMatch[1], value);
    }
  }

  const filters: Array<{
    column: string;
    operator: string;
    value: string | null;
  }> = [];

  const columns = new Set([
    ...filterOperators.keys(),
    ...filterValues.keys(),
  ]);

  columns.forEach((column) => {
    filters.push({
      column,
      operator: filterOperators.get(column) ?? "equals",
      value: filterValues.get(column) ?? null,
    });
  });

  return {
    table,
    page,
    limit,
    filters,
  };
}

function applyFilter(
  query: PostgrestFilterBuilder<any, any, any, any>,
  column: string,
  operator: string,
  value: string | null
) {
  switch (operator) {
    case "equals":
      return query.eq(column, value);
    case "not_equals":
      return query.neq(column, value);
    case "contains":
      return query.ilike(column, value ? `%${value}%` : "%");
    case "greater_than":
      return query.gt(column, value);
    case "less_than":
      return query.lt(column, value);
    case "greater_than_or_equal":
      return query.gte(column, value);
    case "less_than_or_equal":
      return query.lte(column, value);
    case "is_null":
      return query.is(column, null);
    case "is_not_null":
      return query.not(column, "is", null);
    default:
      return query;
  }
}

function handleError(error: unknown) {
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: "Validation failed",
        issues: error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      },
      { status: 400 }
    );
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

