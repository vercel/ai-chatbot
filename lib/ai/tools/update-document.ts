import { tool, type UIMessageStreamWriter } from "ai";
import { z } from "zod";
import { documentHandlersByArtifactKind } from "@/lib/artifacts/server";
import type { ChatMessage } from "@/lib/types";

type UpdateDocumentProps = {
  session: null;
  dataStream: UIMessageStreamWriter<ChatMessage> | null;
};

// Stateless: Documents are passed in-memory via tool context
// For now, updateDocument requires the document content to be passed as context
export const updateDocument = ({ dataStream }: UpdateDocumentProps) =>
  tool({
    description: "Update a document with the given description.",
    inputSchema: z.object({
      id: z.string().describe("The ID of the document to update"),
      description: z
        .string()
        .describe("The description of changes that need to be made"),
      documentContent: z.string().optional().describe("Current document content (required in stateless mode)"),
      documentKind: z.enum(["text", "code", "sheet"]).optional().describe("Document kind (required in stateless mode)"),
    }),
    execute: async ({ id, description, documentContent, documentKind }) => {
      // Stateless: Document content and kind must be passed in tool call
      // In a real implementation, this would come from client-side state
      if (!documentContent || !documentKind) {
        return {
          error: "Document content and kind are required. In stateless mode, these must be provided in the tool call.",
        };
      }

      dataStream?.write({
        type: "data-clear",
        data: null,
        transient: true,
      });

      const documentHandler = documentHandlersByArtifactKind.find(
        (documentHandlerByArtifactKind) =>
          documentHandlerByArtifactKind.kind === documentKind
      );

      if (!documentHandler) {
        throw new Error(`No document handler found for kind: ${documentKind}`);
      }

      await documentHandler.onUpdateDocument({
        documentId: id,
        documentKind,
        documentContent,
        description,
        dataStream: dataStream || null,
      });

      dataStream?.write({ type: "data-finish", data: null, transient: true });

      return {
        id,
        title: document.title,
        kind: document.kind,
        content: "The document has been updated successfully.",
      };
    },
  });
