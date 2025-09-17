import type { AppUsage } from '@/lib/usage';

export type Visibility = 'public' | 'private';

export interface DBUser {
  id: string;
  email: string;
  password: string | null;
  name?: string | null;
  image?: string | null;
  userType: 'GUEST' | 'REGULAR';
  createdAt: Date;
  updatedAt: Date;
}

export interface DBChat {
  id: string;
  createdAt: Date;
  title: string;
  userId: string;
  visibility: Visibility;
  lastContext: AppUsage | null;
}

export interface DBMessage {
  id: string;
  chatId: string;
  role: string;
  parts: unknown;
  attachments: unknown;
  createdAt: Date;
}

export interface DBVote {
  chatId: string;
  messageId: string;
  isUpvoted: boolean;
  createdAt: Date;
}

export type ArtifactKind = 'text' | 'code' | 'image' | 'sheet';
export type DocumentKind = ArtifactKind;

export interface DBDocument {
  id: string;
  createdAt: Date;
  title: string;
  content: string | null;
  kind: ArtifactKind;
  userId: string;
}

export interface DBSuggestion {
  id: string;
  documentId: string;
  documentCreatedAt: Date;
  originalText: string;
  suggestedText: string;
  description: string | null;
  isResolved: boolean;
  userId: string;
  createdAt: Date;
}

export type Chat = DBChat;
export type Message = DBMessage;
export type Document = DBDocument;
export type Suggestion = DBSuggestion;
export type Vote = DBVote;
