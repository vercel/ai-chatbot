"use server";

import { headers } from "next/headers";
import type { Document } from "@/generated/client";
import { auth } from "@/lib/auth";
import { getDocumentsById } from "@/lib/db/queries";
import { ChatSDKError } from "@/lib/errors";

export const getDocuments = async (
  id: string
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
      error: new ChatSDKError("bad_request:api", "Parameter id is missing"),
    };
  }

  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    return { error: new ChatSDKError("unauthorized:document") };
  }

  const documents = await getDocumentsById({ id });

  const [document] = documents;

  if (!document) {
    return { error: new ChatSDKError("not_found:document") };
  }

  if (document.userId !== session.user.id) {
    return { error: new ChatSDKError("forbidden:document") };
  }

  return { data: documents };
};
