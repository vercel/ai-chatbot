import type { UIMessageStreamWriter } from "ai";
import { codeDocumentHandler } from "@/artifacts/code/server";
import { sheetDocumentHandler } from "@/artifacts/sheet/server";
import { textDocumentHandler } from "@/artifacts/text/server";
import type { ArtifactKind } from "@/components/artifact";
import type { ChatMessage } from "../types";

export type CreateDocumentCallbackProps = {
  id: string;
  title: string;
  dataStream: UIMessageStreamWriter<ChatMessage> | null;
};

export type UpdateDocumentCallbackProps = {
  documentId: string;
  documentKind: ArtifactKind;
  documentContent: string;
  description: string;
  dataStream: UIMessageStreamWriter<ChatMessage> | null;
};

export type DocumentHandler<T = ArtifactKind> = {
  kind: T;
  onCreateDocument: (args: CreateDocumentCallbackProps) => Promise<void>;
  onUpdateDocument: (args: UpdateDocumentCallbackProps) => Promise<void>;
};

export function createDocumentHandler<T extends ArtifactKind>(config: {
  kind: T;
  onCreateDocument: (params: CreateDocumentCallbackProps) => Promise<string>;
  onUpdateDocument: (params: UpdateDocumentCallbackProps) => Promise<string>;
}): DocumentHandler<T> {
  return {
    kind: config.kind,
    onCreateDocument: async (args: CreateDocumentCallbackProps) => {
      // Stateless: Create document content only, don't persist
      await config.onCreateDocument({
        id: args.id,
        title: args.title,
        dataStream: args.dataStream,
      });
      return;
    },
    onUpdateDocument: async (args: UpdateDocumentCallbackProps) => {
      // Stateless: Update document content only, don't persist
      await config.onUpdateDocument({
        documentId: args.documentId,
        documentKind: args.documentKind,
        documentContent: args.documentContent,
        description: args.description,
        dataStream: args.dataStream,
      });
      return;
    },
  };
}

/*
 * Use this array to define the document handlers for each artifact kind.
 */
export const documentHandlersByArtifactKind: DocumentHandler[] = [
  textDocumentHandler,
  codeDocumentHandler,
  sheetDocumentHandler,
];

export const artifactKinds = ["text", "code", "sheet"] as const;
