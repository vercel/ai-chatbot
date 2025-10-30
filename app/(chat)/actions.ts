"use server";

import { cookies } from "next/headers";

// Stateless: Only minimal server actions remain
export async function saveChatModelAsCookie(model: string) {
  const cookieStore = await cookies();
  cookieStore.set("chat-model", model);
}

// Stateless: Removed database-dependent functions
// - generateTitleFromUserMessage: Not needed in stateless mode
// - deleteTrailingMessages: Client manages message state
// - updateChatVisibility: Client manages visibility state
