"use server";

import { z } from "zod";

import { createGuest, login as authLogin, register as authRegister } from "@/lib/auth-service";

const authFormSchema = z.object({
  email: z.string().email(),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .max(72, "Password cannot exceed 72 characters")
    .refine(
      (password) => {
        // Check UTF-8 byte length (bcrypt limit is 72 bytes)
        // Most ASCII characters are 1 byte, but emojis/special chars can be 2-4 bytes
        const byteLength = new TextEncoder().encode(password).length;
        return byteLength <= 72;
      },
      {
        message:
          "Password is too long when encoded (max 72 bytes). Try a shorter password or avoid special characters.",
      }
    ),
});

export type LoginActionState = {
  status: "idle" | "in_progress" | "success" | "failed" | "invalid_data";
};

export const login = async (
  _: LoginActionState,
  formData: FormData
): Promise<LoginActionState> => {
  try {
    const validatedData = authFormSchema.parse({
      email: formData.get("email"),
      password: formData.get("password"),
    });

    await authLogin(validatedData.email, validatedData.password);

    return { status: "success" };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { status: "invalid_data" };
    }

    return { status: "failed" };
  }
};

export type RegisterActionState = {
  status:
    | "idle"
    | "in_progress"
    | "success"
    | "failed"
    | "user_exists"
    | "invalid_data";
};

export const register = async (
  _: RegisterActionState,
  formData: FormData
): Promise<RegisterActionState> => {
  try {
    const validatedData = authFormSchema.parse({
      email: formData.get("email"),
      password: formData.get("password"),
    });

    try {
      await authRegister(validatedData.email, validatedData.password);
      return { status: "success" };
    } catch (error: any) {
      // Check if error is "Email already registered"
      const errorMessage = error?.message || String(error);
      if (
        errorMessage.includes("already registered") ||
        errorMessage.includes("Email already registered")
      ) {
        return { status: "user_exists" } as RegisterActionState;
      }
      // Check if error is password length issue
      if (
        errorMessage.includes("cannot exceed 72") ||
        errorMessage.includes("Password cannot exceed")
      ) {
        return { status: "invalid_data" } as RegisterActionState;
      }
      console.error("Registration error:", error);
      throw error;
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { status: "invalid_data" };
    }

    return { status: "failed" };
  }
};
