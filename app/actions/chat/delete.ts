"use server";

import { auth } from "@/app/(auth)/auth";
import { deleteChatById, getChatById } from "@/lib/db/queries";
import type { Chat } from "@/lib/db/schema";
import { ChatSDKError } from "@/lib/errors";

export const deleteChat = async (
  id: string
): Promise<
  | {
      data: Chat;
    }
  | {
      error: ChatSDKError;
    }
> => {
  if (!id) {
    return { error: new ChatSDKError("bad_request:api") };
  }

  const session = await auth();

  if (!session?.user) {
    return { error: new ChatSDKError("unauthorized:chat") };
  }

  const chat = await getChatById({ id });

  if (chat?.userId !== session.user.id) {
    return { error: new ChatSDKError("forbidden:chat") };
  }

  const deletedChat = await deleteChatById({ id });

  return { data: deletedChat };
};
