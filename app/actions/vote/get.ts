"use server";

import { headers } from "next/headers";
import type { Vote_v2 as Vote } from "@/generated/client";
import { auth } from "@/lib/auth";
import { getChatById, getVotesByChatId } from "@/lib/db/queries";
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
  const session = await auth.api.getSession({ headers: await headers() });

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
