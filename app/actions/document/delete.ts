"use server";

import { headers } from "next/headers";
import type { Document } from "@/generated/client";
import { auth } from "@/lib/auth";
import {
  deleteDocumentsByIdAfterTimestamp,
  getDocumentsById,
} from "@/lib/db/queries";
import { ChatSDKError } from "@/lib/errors";

export const deleteDocuments = async (
  id: string,
  timestamp: string
): Promise<
  | {
      data: Document[];
    }
  | {
      error: ChatSDKError;
    }
> => {
  if (!id) {
    return {
      error: new ChatSDKError("bad_request:api", "Parameter id is required."),
    };
  }

  if (!timestamp) {
    return {
      error: new ChatSDKError(
        "bad_request:api",
        "Parameter timestamp is required."
      ),
    };
  }

  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    return { error: new ChatSDKError("unauthorized:document") };
  }

  const documents = await getDocumentsById({ id });

  const [document] = documents;

  if (document.userId !== session.user.id) {
    return { error: new ChatSDKError("forbidden:document") };
  }

  const documentsDeleted = await deleteDocumentsByIdAfterTimestamp({
    id,
    timestamp: new Date(timestamp),
  });

  return { data: documentsDeleted };
};
