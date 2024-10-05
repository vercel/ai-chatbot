import { getUserFromSession } from "@/app/(auth)/actions";
import { createClient } from "@/utils/supabase/server";

export async function GET() {
  const supabase = createClient();
  const user = await getUserFromSession();

  if (!user) {
    return Response.json("Unauthorized!", { status: 401 });
  }

  const { data: chats } = await supabase
    .from("chat")
    .select("*")
    .order("createdAt", { ascending: false });
  return Response.json(chats);
}
