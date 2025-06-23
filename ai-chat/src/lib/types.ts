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

export type UserType = "guest" | "regular";

export type Chat = {
  id: string;
  createdAt: Date;
  title: string;
  userId: string;
  visibility: "public" | "private";
};

export interface User {
  id?: string;
  email?: string | null;
  type: UserType;
}
