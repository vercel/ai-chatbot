import { NextResponse } from "next/server";
import { ZodError } from "zod";

import {
  getWorkspaceAppSummary,
  saveOpenAiWorkspaceApp,
  savePostgresWorkspaceApp,
  workspaceAppTypeSchema,
} from "@/lib/server/workspace-apps";
import { resolveTenantContext } from "@/lib/server/tenant/context";
import { requireCapability } from "@/lib/server/tenant/permissions";

const typeParamSchema = workspaceAppTypeSchema;

type RouteContext = {
  params: Promise<{
    type: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const tenant = await resolveTenantContext();
    requireCapability(tenant, "workspace.manage");
    const params = await context.params;
    const type = typeParamSchema.parse(params.type);

    const app = await getWorkspaceAppSummary(tenant, type);
    return NextResponse.json({ app });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const tenant = await resolveTenantContext();
    requireCapability(tenant, "workspace.manage");
    const params = await context.params;
    const type = typeParamSchema.parse(params.type);
    const payload = await request.json();

    const app =
      type === "postgres"
        ? await savePostgresWorkspaceApp(tenant, payload)
        : await saveOpenAiWorkspaceApp(tenant, payload);

    return NextResponse.json({ app });
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
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ error: "Unknown error" }, { status: 500 });
}


