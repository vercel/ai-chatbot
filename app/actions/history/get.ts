"use server";

import { headers } from "next/headers";
import type { Chat } from "@/generated/client";
import { auth } from "@/lib/auth";
import { getChatsByUserId } from "@/lib/db/queries";
import { ChatSDKError } from "@/lib/errors";

export const getChatHistory = async (
  limit = 10,
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

  const session = await auth.api.getSession({ headers: await headers() });

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
