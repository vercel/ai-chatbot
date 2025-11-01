"use server";

import { headers } from "next/headers";
import type { Suggestion } from "@/generated/client";
import { auth } from "@/lib/auth";
import { getSuggestionsByDocumentId } from "@/lib/db/queries";
import { ChatSDKError } from "@/lib/errors";

export const getSuggestions = async (
  documentId: string
): Promise<
  | {
      data: Suggestion[];
    }
  | {
      error: ChatSDKError;
    }
> => {
  if (!documentId) {
    return {
      error: new ChatSDKError(
        "bad_request:api",
        "Parameter documentId is required."
      ),
    };
  }

  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    return { error: new ChatSDKError("unauthorized:suggestions") };
  }

  const suggestions = await getSuggestionsByDocumentId({
    documentId,
  });

  const [suggestion] = suggestions;

  if (!suggestion) {
    return { data: [] };
  }

  if (suggestion.userId !== session.user.id) {
    return { error: new ChatSDKError("forbidden:api") };
  }

  return { data: suggestions };
};
