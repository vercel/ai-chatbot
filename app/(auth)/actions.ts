"use server";

import { createUser, getUser } from "@/db/queries";

import { signIn } from "./auth";

export interface LoginActionState {
  status: "idle" | "in_progress" | "success" | "failed";
}

export const login = async (
  _: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> => {
  try {
    await signIn("credentials", {
      email: formData.get("email") as string,
      password: formData.get("password") as string,
      redirect: false,
    });

    return { status: "success" } as LoginActionState;
  } catch {
    return { status: "failed" } as LoginActionState;
  }
};

export interface RegisterActionState {
  status: "idle" | "in_progress" | "success" | "failed" | "user_exists";
}

export const register = async (_: RegisterActionState, formData: FormData) => {
  let email = formData.get("email") as string;
  let password = formData.get("password") as string;
  let user = await getUser(email);

  if (user.length > 0) {
    return { status: "user_exists" } as RegisterActionState;
  } else {
    await createUser(email, password);
    await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    return { status: "success" } as RegisterActionState;
  }
};
