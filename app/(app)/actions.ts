"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

export async function signOut() {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();
  
  // Clear all Supabase auth cookies
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();
  
  for (const cookie of allCookies) {
    if (cookie.name.startsWith("sb-") || cookie.name.includes("supabase")) {
      cookieStore.delete(cookie.name);
    }
  }
  
  if (error) {
    console.error("Sign out error:", error);
  }
  
  redirect("/");
}

