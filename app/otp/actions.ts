"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { user, workspace, workspaceUser } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { getAppMode, resolveTenantContext } from "@/lib/server/tenant/context";
import { getResourceStore } from "@/lib/server/tenant/resource-store";
import { seedDefaultRoles } from "@/lib/server/tenant/default-roles";

const otpSchema = z.object({
  email: z.string().email(),
  token: z.string().length(6),
});

export type VerifyOTPState = {
  status: "idle" | "in_progress" | "success" | "failed" | "invalid_data";
  message?: string;
};

export async function verifyOTP(
  _: VerifyOTPState,
  formData: FormData,
): Promise<VerifyOTPState> {
  try {
    const email = formData.get("email");
    const token = formData.get("token");

    const validatedData = otpSchema.parse({
      email,
      token,
    });

    const supabase = await createClient();

    const { data, error } = await supabase.auth.verifyOtp({
      email: validatedData.email,
      token: validatedData.token,
      type: "email",
    });

    if (error || !data.user) {
      return {
        status: "failed",
        message: error?.message ?? "Invalid OTP code",
      };
    }

    // Verify session is available after OTP verification
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      console.error(
        "Session not available after OTP verification:",
        sessionError,
      );
      return {
        status: "failed",
        message: "Session could not be established. Please try again.",
      };
    }

    // Create user record and ensure workspace membership before resolving tenant context
    const mode = getAppMode();
    const sql = postgres(process.env.POSTGRES_URL!);
    const db = drizzle(sql);

    try {
      // Create user record if it doesn't exist
      const [existingUser] = await db
        .select()
        .from(user)
        .where(eq(user.id, data.user.id))
        .limit(1);

      if (!existingUser) {
        await db.insert(user).values({
          id: data.user.id,
          email: validatedData.email,
          onboarding_completed: false,
        });
      }

      // Ensure workspace membership exists (required for resolveTenantContext)
      if (mode === "local") {
        // In local mode, ensure membership in the default workspace
        const DEFAULT_WORKSPACE_SLUG = "default";
        const [defaultWorkspace] = await db
          .select({ id: workspace.id })
          .from(workspace)
          .where(eq(workspace.slug, DEFAULT_WORKSPACE_SLUG))
          .limit(1);

        if (defaultWorkspace) {
          await seedDefaultRoles(db, defaultWorkspace.id);
          const [existingMembership] = await db
            .select({ id: workspaceUser.id })
            .from(workspaceUser)
            .where(
              and(
                eq(workspaceUser.workspace_id, defaultWorkspace.id),
                eq(workspaceUser.user_id, data.user.id),
              ),
            )
            .limit(1);

          if (!existingMembership) {
            await db.insert(workspaceUser).values({
              workspace_id: defaultWorkspace.id,
              user_id: data.user.id,
              role_id: "user",
              metadata: {},
            });
          }
        }
      } else {
        // In hosted mode, check if user has any workspace membership
        const [membership] = await db
          .select({ id: workspaceUser.id })
          .from(workspaceUser)
          .where(eq(workspaceUser.user_id, data.user.id))
          .limit(1);

        if (!membership) {
          // Create a personal workspace for the user
          const [newWorkspace] = await db
            .insert(workspace)
            .values({
              name: `${validatedData.email}'s Workspace`,
              slug: `user-${data.user.id}`,
              owner_user_id: data.user.id,
              mode: "hosted",
              metadata: {},
            })
            .returning({ id: workspace.id });

          await seedDefaultRoles(db, newWorkspace.id);

          await db.insert(workspaceUser).values({
            workspace_id: newWorkspace.id,
            user_id: data.user.id,
            role_id: "admin",
            metadata: {},
          });
        }
      }
    } finally {
      await sql.end({ timeout: 5 });
    }

    // Now resolve tenant context (should work since membership exists)
    let tenant;
    try {
      tenant = await resolveTenantContext();
    } catch (tenantError) {
      console.error("Failed to resolve tenant context:", tenantError);
      return {
        status: "failed",
        message: tenantError instanceof Error
          ? tenantError.message
          : "Failed to initialize workspace. Please try again.",
      };
    }

    const store = await getResourceStore(tenant);
    try {
      const userId = data.user.id;
      const [userRecord] = await store.withSqlClient((db) =>
        db.select().from(user).where(eq(user.id, userId)).limit(1)
      );

      if (!userRecord?.onboarding_completed) {
        redirect("/onboarding");
      }
    } finally {
      await store.dispose();
    }

    redirect("/");
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        status: "invalid_data",
        message: "Please enter a valid email and 6-digit code",
      };
    }

    // If redirect was called, re-throw it
    if (error && typeof error === "object" && "digest" in error) {
      throw error;
    }

    // Log the error for debugging
    console.error("OTP verification error:", error);

    return {
      status: "failed",
      message: error instanceof Error
        ? error.message
        : "Failed to verify OTP code. Please try again.",
    };
  }
}
