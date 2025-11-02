import { streamObject, tool, type UIMessageStreamWriter } from "ai";
import { z } from "zod";
import type { ChatMessage } from "@/lib/types";
import { generateUUID } from "@/lib/utils";
import { myProvider } from "../providers";

type RequestSuggestionsProps = {
  session: null;
  dataStream: UIMessageStreamWriter<ChatMessage> | null;
};

export const requestSuggestions = ({ dataStream }: RequestSuggestionsProps) =>
  tool({
    description: "Request suggestions for a document",
    inputSchema: z.object({
      documentId: z
        .string()
        .describe("The ID of the document to request edits"),
      documentContent: z.string().describe("The document content to analyze"),
    }),
    execute: async ({ documentId, documentContent }) => {
      // Stateless: Document content must be provided
      if (!documentContent) {
        return {
          error: "Document content is required",
        };
      }

      const suggestions: Array<{
        originalText: string;
        suggestedText: string;
        description: string;
        id: string;
        documentId: string;
      }> = [];

      const { elementStream } = streamObject({
        model: myProvider.languageModel("artifact-model"),
        system:
          "You are a help writing assistant. Given a piece of writing, please offer suggestions to improve the piece of writing and describe the change. It is very important for the edits to contain full sentences instead of just words. Max 5 suggestions.",
        prompt: documentContent,
        output: "array",
        schema: z.object({
          originalSentence: z.string().describe("The original sentence"),
          suggestedSentence: z.string().describe("The suggested sentence"),
          description: z.string().describe("The description of the suggestion"),
        }),
      });

      for await (const element of elementStream) {
        const suggestion = {
          originalText: element.originalSentence,
          suggestedText: element.suggestedSentence,
          description: element.description,
          id: generateUUID(),
          documentId,
          isResolved: false,
        };

        dataStream?.write({
          type: "data-suggestion",
          data: suggestion,
          transient: true,
        });

        suggestions.push(suggestion);
      }

      // Stateless: Don't persist suggestions
      return {
        id: documentId,
        message: "Suggestions have been generated",
        suggestionsCount: suggestions.length,
      };
    },
  });
