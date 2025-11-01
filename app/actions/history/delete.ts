"use server";

import { auth } from "@/app/(auth)/auth";
import { deleteAllChatsByUserId } from "@/lib/db/queries";
import type { Chat } from "@/lib/db/schema";
import { ChatSDKError } from "@/lib/errors";

export const deleteAllChats = async (): Promise<
  | {
      data: Chat[];
    }
  | {
      error: ChatSDKError;
    }
> => {
  const session = await auth();

  if (!session?.user) {
    return { error: new ChatSDKError("unauthorized:chat") };
  }

  const result = await deleteAllChatsByUserId({ userId: session.user.id });

  return { data: result };
};
