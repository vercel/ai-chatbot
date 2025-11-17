"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const emailSchema = z.string().email();

export type SendOTPState = {
  status: "idle" | "in_progress" | "success" | "failed" | "invalid_email";
  message?: string;
};

export async function sendOTP(
  _: SendOTPState,
  formData: FormData
): Promise<SendOTPState> {
  try {
    const email = formData.get("email");
    const validatedEmail = emailSchema.parse(email);

    const supabase = await createClient();

    const { error } = await supabase.auth.signInWithOtp({
      email: validatedEmail,
      options: {
        shouldCreateUser: true,
      },
    });

    if (error) {
      return {
        status: "failed",
        message: error.message,
      };
    }

    return {
      status: "success",
      message: "OTP code sent to your email",
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        status: "invalid_email",
        message: "Please enter a valid email address",
      };
    }

    return {
      status: "failed",
      message: "Failed to send OTP code",
    };
  }
}




