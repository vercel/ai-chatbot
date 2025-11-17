import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { resolveTenantContext } from "@/lib/server/tenant/context";
import { requireCapability } from "@/lib/server/tenant/permissions";
import { getPageById } from "@/lib/server/pages";

type RouteParams = {
  params: {
    pageId: string;
  };
};

export async function GET(_request: Request, context: RouteParams) {
  try {
    const tenant = await resolveTenantContext();
    requireCapability(tenant, "pages.view");
    const page = await getPageById(tenant, context.params.pageId);

    if (!page) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    return NextResponse.json({ page });
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

