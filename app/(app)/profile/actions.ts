"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { user } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { getAuthenticatedUser } from "@/lib/supabase/server";
import { getAppMode, resolveTenantContext } from "@/lib/server/tenant/context";
import { getResourceStore } from "@/lib/server/tenant/resource-store";
import { revalidatePath } from "next/cache";

const profileSchema = z.object({
  firstname: z.string().min(1, "First name is required"),
  lastname: z.string().min(1, "Last name is required"),
  email: z.string().email("Please provide a valid email"),
  job_title: z.string().trim().max(200).optional(),
  avatar_url: z
    .string()
    .trim()
    .url("Please provide a valid URL")
    .or(z.literal(""))
    .optional(),
});

export type UpdateProfileState = {
  status: "idle" | "in_progress" | "success" | "failed" | "invalid_data";
  message?: string;
};

export async function updateProfile(
  _: UpdateProfileState,
  formData: FormData
): Promise<UpdateProfileState> {
  try {
    const authUser = await getAuthenticatedUser();

    if (!authUser) {
      redirect("/signin");
    }

    const validatedData = profileSchema.parse({
      firstname: formData.get("firstname"),
      lastname: formData.get("lastname"),
      email: formData.get("email"),
      job_title: formData.get("job_title"),
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
          .update(user)
          .set({
            firstname: validatedData.firstname,
            lastname: validatedData.lastname,
            email: validatedData.email,
            job_title: normalizeNullable(validatedData.job_title),
            avatar_url: normalizeNullable(validatedData.avatar_url),
          })
          .where(eq(user.id, authUser.id));
      } finally {
        await sql.end({ timeout: 5 });
      }
    } else {
      const store = await getResourceStore(tenant);
      try {
        await store.withSqlClient((db) =>
          db
            .update(user)
            .set({
              firstname: validatedData.firstname,
              lastname: validatedData.lastname,
              email: validatedData.email,
              job_title: normalizeNullable(validatedData.job_title),
              avatar_url: normalizeNullable(validatedData.avatar_url),
            })
            .where(eq(user.id, authUser.id))
        );
      } finally {
        await store.dispose();
      }
    }

    revalidatePath("/profile");

    return {
      status: "success",
      message: "Profile updated successfully",
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

    console.error("Failed to update profile:", error);
    return {
      status: "failed",
      message: "Failed to update profile",
    };
  }
}

export async function getUserProfile() {
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
        const [userData] = await db
          .select()
          .from(user)
          .where(eq(user.id, authUser.id))
          .limit(1);

        return userData ?? null;
      } finally {
        await sql.end({ timeout: 5 });
      }
    } else {
      const store = await getResourceStore(tenant);
      try {
        const [userData] = await store.withSqlClient((db) =>
          db.select().from(user).where(eq(user.id, authUser.id)).limit(1)
        );

        return userData ?? null;
      } finally {
        await store.dispose();
      }
    }
  } catch (error) {
    console.error("Failed to load user profile:", error);
    return null;
  }
}
