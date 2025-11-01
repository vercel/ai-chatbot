"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getChatById, voteMessage } from "@/lib/db/queries";
import { ChatSDKError } from "@/lib/errors";

export const voteOnMessage = async (
  chatId: string,
  messageId: string,
  type: "up" | "down"
): Promise<
  | {
      data: { success: true };
    }
  | {
      error: ChatSDKError;
    }
> => {
  if (!chatId || !messageId || !type) {
    return {
      error: new ChatSDKError(
        "bad_request:api",
        "Parameters chatId, messageId, and type are required."
      ),
    };
  }

  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    return { error: new ChatSDKError("unauthorized:vote") };
  }

  const chat = await getChatById({ id: chatId });

  if (!chat) {
    return { error: new ChatSDKError("not_found:vote") };
  }

  if (chat.userId !== session.user.id) {
    return { error: new ChatSDKError("forbidden:vote") };
  }

  await voteMessage({
    chatId,
    messageId,
    type,
  });

  return { data: { success: true } };
};
