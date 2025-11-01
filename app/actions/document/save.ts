"use server";

import { auth } from "@/app/(auth)/auth";
import type { ArtifactKind } from "@/components/artifact";
import { getDocumentsById, saveDocument } from "@/lib/db/queries";
import type { Document } from "@/lib/db/schema";
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

  const session = await auth();

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
