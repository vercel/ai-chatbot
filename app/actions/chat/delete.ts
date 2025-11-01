"use server";

import { headers } from "next/headers";
import type { Chat } from "@/generated/client";
import { auth } from "@/lib/auth";
import { deleteChatById, getChatById } from "@/lib/db/queries";
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

  const session = await auth.api.getSession({ headers: await headers() });

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
