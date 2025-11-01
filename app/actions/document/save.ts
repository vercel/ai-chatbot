"use server";

import { headers } from "next/headers";
import type { ArtifactKind } from "@/components/artifact";
import type { Document } from "@/generated/client";
import { auth } from "@/lib/auth";
import { getDocumentsById, saveDocument } from "@/lib/db/queries";
import { ChatSDKError } from "@/lib/errors";

export const saveDocumentAction = async (
  id: string,
  content: string,
  title: string,
  kind: ArtifactKind
): Promise<
  | {
      data: Document;
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

  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    return { error: new ChatSDKError("not_found:document") };
  }

  const documents = await getDocumentsById({ id });

  if (documents.length > 0) {
    const [doc] = documents;

    if (doc.userId !== session.user.id) {
      return { error: new ChatSDKError("forbidden:document") };
    }
  }

  const document = await saveDocument({
    id,
    content,
    title,
    kind,
    userId: session.user.id,
  });

  return { data: document };
};
