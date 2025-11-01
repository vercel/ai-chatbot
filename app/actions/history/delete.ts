"use server";

import { headers } from "next/headers";
import type { Chat } from "@/generated/client";
import { auth } from "@/lib/auth";
import { deleteAllChatsByUserId } from "@/lib/db/queries";
import { ChatSDKError } from "@/lib/errors";

export const deleteAllChats = async (): Promise<
  | {
      data: Chat[];
    }
  | {
      error: ChatSDKError;
    }
> => {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    return { error: new ChatSDKError("unauthorized:chat") };
  }

  const result = await deleteAllChatsByUserId({ userId: session.user.id });

  return { data: result };
};
