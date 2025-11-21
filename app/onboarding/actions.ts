"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { user, workspace } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { getAppMode, resolveTenantContext } from "@/lib/server/tenant/context";
import { getResourceStore } from "@/lib/server/tenant/resource-store";

const onboardingSchema = z.object({
  firstname: z.string().min(1, "First name is required"),
  lastname: z.string().min(1, "Last name is required"),
  profile_pic_url: z
    .string()
    .trim()
    .url("Please provide a valid URL")
    .or(z.literal(""))
    .optional(),
  job_title: z.string().trim().max(200).optional(),
  role_experience: z.string().trim().max(2000).optional(),
  technical_proficiency: z
    .enum(["less", "regular", "more"])
    .default("regular")
    .optional(),
  tone_of_voice: z.string().trim().max(2000).optional(),
  ai_generation_guidance: z.string().trim().max(4000).optional(),
  workspace_name: z.string().min(1, "Workspace name is required"),
  workspace_profile_pic_url: z
    .string()
    .trim()
    .url("Please provide a valid URL")
    .or(z.literal(""))
    .optional(),
  business_description: z.string().trim().max(4000).optional(),
});

export type CompleteOnboardingState = {
  status: "idle" | "in_progress" | "success" | "failed" | "invalid_data";
  message?: string;
};

export async function completeOnboarding(
  _: CompleteOnboardingState,
  formData: FormData
): Promise<CompleteOnboardingState> {
  try {
    const supabase = await createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      redirect("/signin");
    }

    const validatedData = onboardingSchema.parse({
      firstname: formData.get("firstname"),
      lastname: formData.get("lastname"),
      profile_pic_url: formData.get("profile_pic_url"),
      job_title: formData.get("job_title"),
      role_experience: formData.get("role_experience"),
      technical_proficiency: formData.get("technical_proficiency"),
      tone_of_voice: formData.get("tone_of_voice"),
      ai_generation_guidance: formData.get("ai_generation_guidance"),
      workspace_name: formData.get("workspace_name"),
      workspace_profile_pic_url: formData.get("workspace_profile_pic_url"),
      business_description: formData.get("business_description"),
    });

    const normalizeNullable = (value?: string | null) => {
      if (!value) {
        return null;
      }

      const trimmedValue = value.trim();
      return trimmedValue.length === 0 ? null : trimmedValue;
    };

    // In hosted mode, user and workspace are system tables in the main database
    // In local mode, they're in the tenant database via resource store
    const mode = getAppMode();
    const tenant = await resolveTenantContext();

    if (mode === "hosted") {
      // Query/update user and workspace directly from main database
      const sql = postgres(process.env.POSTGRES_URL!);
      const db = drizzle(sql);

      try {
        const [existingUser] = await db
          .select()
          .from(user)
          .where(eq(user.id, authUser.id))
          .limit(1);

        const userPayload = {
          firstname: validatedData.firstname,
          lastname: validatedData.lastname,
          avatar_url: normalizeNullable(validatedData.profile_pic_url),
          job_title: normalizeNullable(validatedData.job_title),
          ai_context: normalizeNullable(validatedData.role_experience),
          proficiency: validatedData.technical_proficiency ?? "regular",
          ai_tone: normalizeNullable(validatedData.tone_of_voice),
          ai_guidance: normalizeNullable(validatedData.ai_generation_guidance),
          onboarding_completed: true,
        };

        if (!existingUser) {
          await db.insert(user).values({
            id: authUser.id,
            email: authUser.email ?? "",
            ...userPayload,
          });
        } else {
          await db
            .update(user)
            .set(userPayload)
            .where(eq(user.id, authUser.id));
        }

        await db
          .update(workspace)
          .set({
            name: validatedData.workspace_name,
            avatar_url: normalizeNullable(
              validatedData.workspace_profile_pic_url,
            ),
            description: normalizeNullable(validatedData.business_description),
          })
          .where(eq(workspace.id, tenant.workspaceId));
      } finally {
        await sql.end({ timeout: 5 });
      }
    } else {
      // Local mode: use resource store
      const store = await getResourceStore(tenant);
      try {
        const [existingUser] = await store.withSqlClient((db) =>
          db.select().from(user).where(eq(user.id, authUser.id)).limit(1),
        );

        const userPayload = {
          firstname: validatedData.firstname,
          lastname: validatedData.lastname,
          avatar_url: normalizeNullable(validatedData.profile_pic_url),
          job_title: normalizeNullable(validatedData.job_title),
          ai_context: normalizeNullable(validatedData.role_experience),
          proficiency: validatedData.technical_proficiency ?? "regular",
          ai_tone: normalizeNullable(validatedData.tone_of_voice),
          ai_guidance: normalizeNullable(validatedData.ai_generation_guidance),
          onboarding_completed: true,
        };

        if (!existingUser) {
          await store.withSqlClient((db) =>
            db.insert(user).values({
              id: authUser.id,
              email: authUser.email ?? "",
              ...userPayload,
            }),
          );
        } else {
          await store.withSqlClient((db) =>
            db
              .update(user)
              .set(userPayload)
              .where(eq(user.id, authUser.id)),
          );
        }

        await store.withSqlClient((db) =>
          db
            .update(workspace)
            .set({
              name: validatedData.workspace_name,
              avatar_url: normalizeNullable(
                validatedData.workspace_profile_pic_url,
              ),
              description: normalizeNullable(validatedData.business_description),
            })
            .where(eq(workspace.id, tenant.workspaceId)),
        );
      } finally {
        await store.dispose();
      }
    }

    redirect("/");
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        status: "invalid_data",
        message: error.issues[0]?.message ?? "Invalid form data",
      };
    }

    // If redirect was called, re-throw it
    if (error && typeof error === "object" && "digest" in error) {
      throw error;
    }

    return {
      status: "failed",
      message: "Failed to complete onboarding",
    };
  }
}

