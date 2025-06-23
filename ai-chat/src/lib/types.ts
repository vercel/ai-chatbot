export type DataPart = { type: 'append-message'; message: string };

export type Document = {
  id: string;
  createdAt: Date;
  title: string;
  userId: string;
  content: string | null;
  kind: 'text' | 'code' | 'image' | 'sheet';
};

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

export type UserType = 'guest' | 'regular';

export type Chat = {
  id: string;
  createdAt: Date;
  title: string;
  userId: string;
  visibility: 'public' | 'private';
};

export interface User {
  id?: string;
  email?: string | null;
  type: UserType;
}

type ISODateString = string;

interface DefaultSession {
  user?: User;
  expires: ISODateString;
}

export interface Session extends DefaultSession {
  user: {
    id: string;
    type: UserType;
  } & DefaultSession['user'];
}
