"use server"

import { z } from "zod"

import { createUser, getUser } from "@/lib/db/queries"

import { signIn } from "./auth"

const authFormSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

export type LoginActionState = {
  status: "idle" | "in_progress" | "success" | "failed" | "invalid_data"
}

export const login = async (_: LoginActionState, formData: FormData): Promise<LoginActionState> => {
  console.log("[auth] login: Starting login attempt")
  console.log("[auth] login: Email:", formData.get("email"))

  try {
    const validatedData = authFormSchema.parse({
      email: formData.get("email"),
      password: formData.get("password"),
    })

    console.log("[auth] login: Validation passed, calling signIn")

    const signInResult = await signIn("credentials", {
      email: validatedData.email,
      password: validatedData.password,
      redirect: false,
    })

    console.log("[auth] login: signIn result:", JSON.stringify(signInResult, null, 2))
    console.log("[auth] login: Success")
    return { status: "success" }
  } catch (error) {
    console.log("[auth] login: Error occurred:", error)
    console.log("[auth] login: Error type:", error?.constructor?.name)

    if (error instanceof z.ZodError) {
      console.log("[auth] login: Validation error:", error.errors)
      return { status: "invalid_data" }
    }

    console.log("[auth] login: Failed with unknown error")
    return { status: "failed" }
  }
}

export type RegisterActionState = {
  status: "idle" | "in_progress" | "success" | "failed" | "user_exists" | "invalid_data"
}

export const register = async (_: RegisterActionState, formData: FormData): Promise<RegisterActionState> => {
  console.log("[auth] register: Starting registration attempt")
  console.log("[auth] register: Email:", formData.get("email"))

  try {
    const validatedData = authFormSchema.parse({
      email: formData.get("email"),
      password: formData.get("password"),
    })

    console.log("[auth] register: Validation passed, checking if user exists")

    const [user] = await getUser(validatedData.email)

    if (user) {
      console.log("[auth] register: User already exists")
      return { status: "user_exists" } as RegisterActionState
    }

    console.log("[auth] register: Creating new user")
    await createUser(validatedData.email, validatedData.password)

    console.log("[auth] register: User created, calling signIn")
    const signInResult = await signIn("credentials", {
      email: validatedData.email,
      password: validatedData.password,
      redirect: false,
    })

    console.log("[auth] register: signIn result:", JSON.stringify(signInResult, null, 2))
    console.log("[auth] register: Success")
    return { status: "success" }
  } catch (error) {
    console.log("[auth] register: Error occurred:", error)
    console.log("[auth] register: Error type:", error?.constructor?.name)

    if (error instanceof z.ZodError) {
      console.log("[auth] register: Validation error:", error.errors)
      return { status: "invalid_data" }
    }

    console.log("[auth] register: Failed with unknown error")
    return { status: "failed" }
  }
}
