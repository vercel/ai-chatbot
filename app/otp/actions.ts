"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { user } from "@/lib/db/schema";

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
  formData: FormData
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

    // Sync user to users table
    const client = postgres(process.env.POSTGRES_URL!);
    const db = drizzle(client);

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

    // Check onboarding status
    const [userRecord] = await db
      .select()
      .from(user)
      .where(eq(user.id, data.user.id))
      .limit(1);

    if (!userRecord?.onboarding_completed) {
      redirect("/onboarding");
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

    return {
      status: "failed",
      message: "Failed to verify OTP code",
    };
  }
}

