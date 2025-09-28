"use server"

import { z } from "zod"
import { auth } from "@/lib/auth"
import { createUser, getUser } from "@/lib/db/queries"
import { headers } from "next/headers"

const authFormSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

export type LoginActionState = {
  status: "idle" | "in_progress" | "success" | "failed" | "invalid_data"
}

export const login = async (
  _: LoginActionState,
  formData: FormData
): Promise<LoginActionState> => {
  try {
    const validatedData = authFormSchema.parse({
      email: formData.get("email"),
      password: formData.get("password"),
    })

    const response = await auth.api.signInEmail({
      body: validatedData,
      headers: await headers(),
      asResponse: true
    })

    if (!response.ok) {
      return { status: "failed" }
    }

    return { status: "success" }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { status: "invalid_data" }
    }
    return { status: "failed" }
  }
}

export type RegisterActionState = {
  status:
    | "idle"
    | "in_progress"
    | "success"
    | "failed"
    | "user_exists"
    | "invalid_data"
}

export const register = async (
  _: RegisterActionState,
  formData: FormData
): Promise<RegisterActionState> => {
  try {
    const validatedData = authFormSchema.parse({
      email: formData.get("email"),
      password: formData.get("password"),
    })

    // Check if user exists
    const [existingUser] = await getUser(validatedData.email)
    if (existingUser) {
      return { status: "user_exists" }
    }

    // Create user in database first
    await createUser(validatedData.email, validatedData.password)

    // Then sign them in
    const response = await auth.api.signInEmail({
      body: validatedData,
      headers: await headers(),
      asResponse: true
    })

    if (!response.ok) {
      return { status: "failed" }
    }

    return { status: "success" }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { status: "invalid_data" }
    }
    return { status: "failed" }
  }
}
