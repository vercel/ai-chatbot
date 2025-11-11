"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { user } from "@/lib/db/schema";

const onboardingSchema = z.object({
  name: z.string().min(1, "Name is required"),
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
      name: formData.get("name"),
    });

    // Update user record (create if doesn't exist)
    const client = postgres(process.env.POSTGRES_URL!);
    const db = drizzle(client);

    // Check if user exists
    const [existingUser] = await db
      .select()
      .from(user)
      .where(eq(user.id, authUser.id))
      .limit(1);

    if (!existingUser) {
      // Create user if doesn't exist
      await db.insert(user).values({
        id: authUser.id,
        email: authUser.email ?? "",
        onboarding_completed: true,
      });
    } else {
      // Update existing user
      await db
        .update(user)
        .set({
          onboarding_completed: true,
        })
        .where(eq(user.id, authUser.id));
    }

    redirect("/");
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        status: "invalid_data",
        message: error.errors[0]?.message ?? "Invalid form data",
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

