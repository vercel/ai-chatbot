export type DataPart = { type: "append-message"; message: string };

export type Suggestion = {
  documentId: string;
  id: string;
  createdAt: Date;
  userId: string;
  documentCreatedAt: Date;
  originalText: string;
  suggestedText: string;
  description: string | null;
  isResolved: boolean;
};

export type Vote = {
  chatId: string;
  messageId: string;
  isUpvoted: boolean;
};
