"use server";

import { Suggestion } from "@ai-chat/lib/editor/suggestions";

const suggestions = [
  {
    documentId: "asdasd",
    id: "asdasd",
    createdAt: new Date(),
    userId: "asdasd",
    documentCreatedAt: new Date(),
    originalText: "asdasd",
    suggestedText: "asdasd",
    description: "asdasd",
    isResolved: false,
  },
  {
    documentId: "asdasd",
    id: "asdasd",
    createdAt: new Date(),
    userId: "asdasd",
    documentCreatedAt: new Date(),
    originalText: "asdasd",
    suggestedText: "asdasd",
    description: "asdasd",
    isResolved: false,
  },
];

export async function getSuggestions({ documentId }: { documentId: string }) {
  return suggestions ?? [];
}
