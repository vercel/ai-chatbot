"use server";

import { auth } from "@/app/(auth)/auth";
import { getChatById, getVotesByChatId } from "@/lib/db/queries";
import type { Vote } from "@/lib/db/schema";
import { ChatSDKError } from "@/lib/errors";

export const getVotes = async (
  chatId: string
): Promise<
  | {
      data: Vote[];
    }
  | {
      error: ChatSDKError;
    }
> => {
  const session = await auth();

  if (!session?.user) {
    return { error: new ChatSDKError("unauthorized:vote") };
  }

  const chat = await getChatById({ id: chatId });

  if (!chat) {
    return { error: new ChatSDKError("not_found:chat") };
  }

  if (chat.userId !== session.user.id) {
    return { error: new ChatSDKError("forbidden:vote") };
  }

  const votes = await getVotesByChatId({ id: chatId });

  return { data: votes };
};
