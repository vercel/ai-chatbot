import { NextResponse } from "next/server";
import { resolveTenantContext } from "@/lib/server/tenant/context";
import { requireCapability } from "@/lib/server/tenant/permissions";
import { getTableConfig } from "@/lib/server/tables";
import { generatePagesForTable } from "@/lib/server/tables/pages/generator";

export async function POST(request: Request) {
  try {
    const tenant = await resolveTenantContext();
    requireCapability(tenant, "tables.edit");

    const { tableId } = await request.json();

    if (!tableId) {
      return NextResponse.json(
        { error: "Table ID is required" },
        { status: 400 }
      );
    }

    const tableConfig = await getTableConfig(tenant, tableId);
    if (!tableConfig) {
      return NextResponse.json(
        { error: "Table not found" },
        { status: 404 }
      );
    }

    await generatePagesForTable(tenant, tableConfig);

    return NextResponse.json({ success: true });
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

