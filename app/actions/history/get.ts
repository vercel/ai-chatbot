"use server";

import { auth } from "@/app/(auth)/auth";
import { getChatsByUserId } from "@/lib/db/queries";
import type { Chat } from "@/lib/db/schema";
import { ChatSDKError } from "@/lib/errors";

export const getChatHistory = async (
  limit: number = 10,
  startingAfter?: string,
  endingBefore?: string
): Promise<
  | {
      data: Chat[];
    }
  | {
      error: ChatSDKError;
    }
> => {
  if (startingAfter && endingBefore) {
    return {
      error: new ChatSDKError(
        "bad_request:api",
        "Only one of starting_after or ending_before can be provided."
      ),
    };
  }

  const session = await auth();

  if (!session?.user) {
    return { error: new ChatSDKError("unauthorized:chat") };
  }

  const chats = await getChatsByUserId({
    id: session.user.id,
    limit,
    startingAfter,
    endingBefore,
  });

  return { data: chats };
};
