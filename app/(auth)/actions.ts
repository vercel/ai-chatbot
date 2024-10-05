"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";

export interface LoginActionState {
  status: "idle" | "in_progress" | "success" | "failed";
}

export const login = async (
  _: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> => {
  const supabase = createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  });

  if (error) {
    return { status: "failed" } as LoginActionState;
  }

  revalidatePath("/", "layout");
  redirect("/");
};

export interface RegisterActionState {
  status: "idle" | "in_progress" | "success" | "failed" | "user_exists";
}

export const register = async (_: RegisterActionState, formData: FormData) => {
  const supabase = createClient();

  let email = formData.get("email") as string;
  let password = formData.get("password") as string;

  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error) {
    if (error.code === "user_already_exists") {
      return { status: "user_exists" } as RegisterActionState;
    }
  }

  const { user, session } = data;

  if (user && session) {
    const { error } = await supabase.auth.signInWithPassword({
      email: formData.get("email") as string,
      password: formData.get("password") as string,
    });

    if (error) {
      return { status: "failed" } as LoginActionState;
    }

    revalidatePath("/", "layout");
    redirect("/");
  } else {
    return { status: "failed" } as RegisterActionState;
  }
};

export const getUserFromSession = async () => {
  const supabase = createClient();
  const { data } = await supabase.auth.getUser();
  return data.user;
};

export const signOut = async () => {
  const supabase = createClient();
  const { error } = await supabase.auth.signOut();

  if (!error) {
    redirect("/login");
  }
};
