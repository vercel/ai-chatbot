import { createClient } from "@/utils/supabase/server";

export async function saveChat({
  id,
  messages,
  userId,
}: {
  id: string;
  messages: any;
  userId: string;
}) {
  const supabase = createClient();

  await supabase.from("chat").upsert({
    id,
    messages,
    userId,
  });
}

export async function getChatById({ id }: { id: string }) {
  const supabase = createClient();

  const { data: chat } = await supabase
    .from("chat")
    .select("*")
    .eq("id", id)
    .single();

  return chat;
}
