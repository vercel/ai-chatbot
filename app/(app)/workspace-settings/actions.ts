"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { workspace } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { getAuthenticatedUser } from "@/lib/supabase/server";
import { getAppMode, resolveTenantContext } from "@/lib/server/tenant/context";
import { getResourceStore } from "@/lib/server/tenant/resource-store";
import { revalidatePath } from "next/cache";

const workspaceSchema = z.object({
  name: z.string().min(1, "Workspace name is required"),
  slug: z.string().trim().optional(),
  description: z.string().trim().max(4000).optional(),
  avatar_url: z
    .string()
    .trim()
    .url("Please provide a valid URL")
    .or(z.literal(""))
    .optional(),
});

export type UpdateWorkspaceState = {
  status: "idle" | "in_progress" | "success" | "failed" | "invalid_data";
  message?: string;
};

export async function updateWorkspace(
  _: UpdateWorkspaceState,
  formData: FormData
): Promise<UpdateWorkspaceState> {
  try {
    const authUser = await getAuthenticatedUser();

    if (!authUser) {
      redirect("/signin");
    }

    const validatedData = workspaceSchema.parse({
      name: formData.get("name"),
      slug: formData.get("slug"),
      description: formData.get("description"),
      avatar_url: formData.get("avatar_url"),
    });

    const normalizeNullable = (value?: string | null) => {
      if (!value) {
        return null;
      }

      const trimmedValue = value.trim();
      return trimmedValue.length === 0 ? null : trimmedValue;
    };

    const mode = getAppMode();
    const tenant = await resolveTenantContext();

    if (mode === "hosted") {
      const sql = postgres(process.env.POSTGRES_URL!);
      const db = drizzle(sql);

      try {
        await db
          .update(workspace)
          .set({
            name: validatedData.name,
            slug: normalizeNullable(validatedData.slug),
            description: normalizeNullable(validatedData.description),
            avatar_url: normalizeNullable(validatedData.avatar_url),
          })
          .where(eq(workspace.id, tenant.workspaceId));
      } finally {
        await sql.end({ timeout: 5 });
      }
    } else {
      const store = await getResourceStore(tenant);
      try {
        await store.withSqlClient((db) =>
          db
            .update(workspace)
            .set({
              name: validatedData.name,
              slug: normalizeNullable(validatedData.slug),
              description: normalizeNullable(validatedData.description),
              avatar_url: normalizeNullable(validatedData.avatar_url),
            })
            .where(eq(workspace.id, tenant.workspaceId))
        );
      } finally {
        await store.dispose();
      }
    }

    revalidatePath("/workspace-settings");

    return {
      status: "success",
      message: "Workspace updated successfully",
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        status: "invalid_data",
        message: error.issues[0]?.message ?? "Invalid form data",
      };
    }

    if (error && typeof error === "object" && "digest" in error) {
      throw error;
    }

    console.error("Failed to update workspace:", error);
    return {
      status: "failed",
      message: "Failed to update workspace",
    };
  }
}

export async function getWorkspaceData() {
  try {
    const authUser = await getAuthenticatedUser();

    if (!authUser) {
      return null;
    }

    const mode = getAppMode();
    const tenant = await resolveTenantContext();

    if (mode === "hosted") {
      const sql = postgres(process.env.POSTGRES_URL!);
      const db = drizzle(sql);

      try {
        const [workspaceData] = await db
          .select()
          .from(workspace)
          .where(eq(workspace.id, tenant.workspaceId))
          .limit(1);

        return workspaceData ?? null;
      } finally {
        await sql.end({ timeout: 5 });
      }
    } else {
      const store = await getResourceStore(tenant);
      try {
        const [workspaceData] = await store.withSqlClient((db) =>
          db
            .select()
            .from(workspace)
            .where(eq(workspace.id, tenant.workspaceId))
            .limit(1)
        );

        return workspaceData ?? null;
      } finally {
        await store.dispose();
      }
    }
  } catch (error) {
    console.error("Failed to load workspace data:", error);
    return null;
  }
}
