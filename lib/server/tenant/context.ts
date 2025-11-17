import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { and, eq } from "drizzle-orm";
import {
  workspace,
  workspaceUser,
} from "@/lib/db/schema";
import { normalizeAppMode, type AppMode } from "@/lib/app-mode";
import { seedDefaultRoles } from "./default-roles";

export type TenantContext = {
  mode: AppMode;
  workspaceId: string;
  userId: string;
  roles: string[];
  connectionId?: string | null;
};

export type ResolveTenantContextOptions = {
  /**
   * Optional pre-fetched headers. When omitted the current headers() helper will be used.
   */
  headers?: Headers;
  /**
   * Explicit workspace identifier to use.
   */
  workspaceId?: string | null;
  /**
   * Optional resource connection identifier for downstream callers.
   */
  connectionId?: string | null;
};

const DEFAULT_WORKSPACE_SLUG = "default";
export type DbClient = ReturnType<typeof drizzle>;

export { type AppMode } from "@/lib/app-mode";

export function getAppMode(): AppMode {
  return normalizeAppMode(process.env.APP_MODE);
}

export async function resolveTenantContext(
  options: ResolveTenantContextOptions = {}
): Promise<TenantContext> {
  const mode = getAppMode();
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("Unauthorized");
  }

  const headerBag = options.headers ?? (await headers());
  const requestedWorkspaceId = options.workspaceId ?? extractWorkspaceId(headerBag);

  const sql = postgres(process.env.POSTGRES_URL!);
  const db = drizzle(sql);

  try {
    if (mode === "local") {
      const workspaceId = await ensureLocalWorkspace(db, user.id, requestedWorkspaceId);
      const roles = await getRolesForWorkspace(db, user.id, workspaceId);

      return {
        mode,
        workspaceId,
        userId: user.id,
        roles,
        connectionId: options.connectionId ?? null,
      };
    }

      const memberships = await db
      .select({
        workspaceId: workspaceUser.workspace_id,
        role: workspaceUser.role_id,
      })
      .from(workspaceUser)
      .where(eq(workspaceUser.user_id, user.id));

    if (memberships.length === 0) {
      throw new Error("Workspace membership required");
    }

    const selectedWorkspaceId =
      requestedWorkspaceId ??
      memberships[0]?.workspaceId ??
      (() => {
        throw new Error("Unable to resolve workspace context");
      })();

    const rolesForWorkspace = memberships
      .filter((membership) => membership.workspaceId === selectedWorkspaceId)
      .map((membership) => membership.role);

    if (rolesForWorkspace.length === 0) {
      throw new Error("Missing role assignment for workspace");
    }

    return {
      mode,
      workspaceId: selectedWorkspaceId,
      userId: user.id,
      roles: rolesForWorkspace,
      connectionId: options.connectionId ?? null,
    };
  } finally {
    await sql.end({ timeout: 5 });
  }
}

function extractWorkspaceId(headerBag: Headers | undefined): string | null {
  if (!headerBag) {
    return null;
  }

  const headerCandidates = ["x-workspace-id", "x-workspace", "x-tenant-id"];
  for (const headerName of headerCandidates) {
    const value = headerBag.get(headerName);
    if (value) {
      return value;
    }
  }

  return null;
}

async function ensureLocalWorkspace(
  db: DbClient,
  userId: string,
  requestedWorkspaceId: string | null
): Promise<string> {
  if (requestedWorkspaceId) {
    await seedDefaultRoles(db, requestedWorkspaceId);
    await ensureMembership(db, requestedWorkspaceId, userId);
    return requestedWorkspaceId;
  }

  const [existingWorkspace] = await db
    .select({
      id: workspace.id,
    })
    .from(workspace)
    .where(eq(workspace.slug, DEFAULT_WORKSPACE_SLUG))
    .limit(1);

  if (existingWorkspace) {
    await seedDefaultRoles(db, existingWorkspace.id);
    await ensureMembership(db, existingWorkspace.id, userId);
    return existingWorkspace.id;
  }

  const [createdWorkspace] = await db
    .insert(workspace)
    .values({
      name: "Local Workspace",
      slug: DEFAULT_WORKSPACE_SLUG,
      owner_user_id: userId,
      mode: "local",
      metadata: {},
    })
    .returning({
      id: workspace.id,
    });

  await seedDefaultRoles(db, createdWorkspace.id);

  await db.insert(workspaceUser).values({
    workspace_id: createdWorkspace.id,
    user_id: userId,
    role_id: "admin",
    metadata: {},
  });

  return createdWorkspace.id;
}

async function ensureMembership(
  db: DbClient,
  workspaceId: string,
  userId: string
) {
  const [existingMembership] = await db
    .select({ id: workspaceUser.id })
    .from(workspaceUser)
    .where(
      and(
        eq(workspaceUser.workspace_id, workspaceId),
        eq(workspaceUser.user_id, userId)
      )
    )
    .limit(1);

  if (!existingMembership) {
    await seedDefaultRoles(db, workspaceId);
    await db.insert(workspaceUser).values({
      workspace_id: workspaceId,
      user_id: userId,
      role_id: "admin",
      metadata: {},
    });
  }
}

async function getRolesForWorkspace(
  db: DbClient,
  userId: string,
  workspaceId: string
): Promise<string[]> {
  const rows = await db
    .select({ role: workspaceUser.role_id })
    .from(workspaceUser)
    .where(
      and(
        eq(workspaceUser.workspace_id, workspaceId),
        eq(workspaceUser.user_id, userId)
      )
    );

  if (rows.length === 0) {
    await seedDefaultRoles(db, workspaceId);
    await db.insert(workspaceUser).values({
      workspace_id: workspaceId,
      user_id: userId,
      role_id: "admin",
      metadata: {},
    });
    return ["admin"];
  }

  return rows.map((row) => row.role);
}

