// lib/supabaseServer.ts
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export const supabaseServer = () => {
  return createServerComponentClient({ cookies });
};
