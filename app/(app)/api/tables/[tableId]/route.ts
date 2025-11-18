import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { resolveTenantContext } from "@/lib/server/tenant/context";
import { requireCapability } from "@/lib/server/tenant/permissions";
import {
  getTableConfig,
  updateTableConfig,
  deleteTableConfig,
  TableNotFoundError,
} from "@/lib/server/tables";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ tableId: string }> }
) {
  try {
    const tenant = await resolveTenantContext();
    requireCapability(tenant, "tables.view");
    const { tableId } = await params;
    const table = await getTableConfig(tenant, tableId);

    if (!table) {
      return NextResponse.json({ error: "Table not found" }, { status: 404 });
    }

    return NextResponse.json({ table });
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ tableId: string }> }
) {
  try {
    const tenant = await resolveTenantContext();
    requireCapability(tenant, "tables.edit");
    const { tableId } = await params;
    const payload = await request.json();
    const table = await updateTableConfig(tenant, tableId, payload);
    return NextResponse.json({ table });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ tableId: string }> }
) {
  try {
    const tenant = await resolveTenantContext();
    requireCapability(tenant, "tables.edit");
    const { tableId } = await params;
    await deleteTableConfig(tenant, tableId);
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleError(error);
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

