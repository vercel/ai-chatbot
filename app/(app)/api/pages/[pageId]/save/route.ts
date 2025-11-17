import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { resolveTenantContext } from "@/lib/server/tenant/context";
import { requireCapability } from "@/lib/server/tenant/permissions";
import { PageNotFoundError, updatePage } from "@/lib/server/pages";

type RouteParams = {
  params: {
    pageId: string;
  };
};

export async function PUT(request: Request, context: RouteParams) {
  try {
    const tenant = await resolveTenantContext();
    requireCapability(tenant, "pages.edit");
    const payload = await request.json();
    const page = await updatePage(tenant, context.params.pageId, payload);
    return NextResponse.json({ page });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: Request, context: RouteParams) {
  return PUT(request, context);
}

function handleError(error: unknown) {
  if (error instanceof PageNotFoundError) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }

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

