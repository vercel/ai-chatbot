export interface Chat {
  id: string;
  createdAt: Date;
  title: string;
  userId: string;
  visibility: 'public' | 'private';
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  organizationId: string;
}

export interface OrganizationRequest {
  name: string;
  description?: string;
}

export interface ChatRequest {
  title: string;
  visibility: 'public' | 'private';
}

export interface MessageRequest {
  chatId: string;
  content: string;
  role: 'user' | 'assistant';
}

export interface ShareChatRequest {
  chatId: string;
  email: string;
}

export interface Document {
  id: string;
  createdAt: Date;
  title: string;
  content: string | null;
  kind: 'text' | 'code' | 'image' | 'sheet';
  userId: string;
}

export interface DocumentRequest {
  title: string;
  content?: string;
  kind?: 'text' | 'code' | 'image' | 'sheet';
  userId: string;
}

export interface Suggestion {
  id: string;
  documentId: string;
  documentCreatedAt: Date;
  originalText: string;
  suggestedText: string;
  description: string | null;
  isResolved: boolean;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SuggestionRequest {
  documentId: string;
  documentCreatedAt: Date;
  originalText: string;
  suggestedText: string;
  description?: string;
  userId: string;
}

export interface Vote {
  chatId: string;
  messageId: string;
  isUpvoted: boolean;
  reaction?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface VoteRequest {
  chatId: string;
  messageId: string;
  isUpvoted: boolean;
  reaction?: string;
}

export interface ApiError {
  message: string;
  status: number;
}

export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  status?: number;
}
export interface ChatVisibilityUpdate {
  visibility: 'public' | 'private';
}