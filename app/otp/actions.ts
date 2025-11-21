"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { user, workspace, workspaceUser } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { getAppMode } from "@/lib/server/tenant/context";
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

    if (!process.env.POSTGRES_URL) {
      console.error("POSTGRES_URL environment variable is not set");
      return {
        status: "failed",
        message: "Database configuration error. Please contact support.",
      };
    }

    let sql;
    let db;
    try {
      sql = postgres(process.env.POSTGRES_URL);
      db = drizzle(sql);
    } catch (connectionError) {
      console.error("Failed to create database connection:", connectionError);
      return {
        status: "failed",
        message: "Database connection error. Please check your configuration.",
      };
    }

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

      // Ensure workspace membership exists
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

          // Note: In hosted mode, tenants must configure their own database connection
          // via workspace_apps. The main database is only for system/configuration data.
          // No automatic connection is created here - tenants will add their connection
          // during onboarding or via settings.
        }
      }

      // Check onboarding status using the same connection before closing it
      // In hosted mode, user is a system table in the main database
      const [userRecord] = await db
        .select()
        .from(user)
        .where(eq(user.id, data.user.id))
        .limit(1);

      if (!userRecord?.onboarding_completed) {
        redirect("/onboarding");
      }
    } catch (dbError) {
      // Log detailed error for debugging
      console.error("Database query error:", dbError);

      // Check if it's a connection/DNS error
      if (
        dbError instanceof Error &&
        (dbError.message.includes("ENOTFOUND") ||
          dbError.message.includes("getaddrinfo") ||
          dbError.cause instanceof Error &&
            (dbError.cause.message.includes("ENOTFOUND") ||
              dbError.cause.message.includes("getaddrinfo")))
      ) {
        return {
          status: "failed",
          message:
            "Database connection failed. Please verify your database connection string is using Supabase's connection pooler format (pooler.supabase.com) instead of the deprecated db.*.supabase.co format.",
        };
      }

      throw dbError;
    } finally {
      if (sql) {
        await sql.end({ timeout: 5 });
      }
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
