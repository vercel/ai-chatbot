import { z } from "zod";

// ============================================
// Enums
// ============================================

export const DocumentKindSchema = z.enum([
  "text",
  "code", 
  "image",
  "sheet",
]);

export const MessageRoleSchema = z.enum([
  "user",
  "assistant", 
  "system",
]);

export const ResolutionStatusSchema = z.enum([
  "pending",
  "resolved",
  "rejected",
]);

export const VisibilitySchema = z.enum([
  "private",
  "public",
]);

// ============================================
// Object Types
// ============================================

export const MessagePartSchema = z.object({
  type: z.string(),
  content: z.string().optional(),
  mimeType: z.string().optional(),
  data: z.instanceof(Uint8Array).optional(),
});

export const MessageAttachmentSchema = z.object({
  name: z.string(),
  mimeType: z.string(),
  size: z.string(), // bigint converted to string for JSON safety
  url: z.string().optional(),
  data: z.instanceof(Uint8Array).optional(),
});

export const AppUsageSchema = z.object({
  app: z.string(),
  version: z.string(),
  features: z.array(z.string()).optional(),
  metadata: z.string().optional(),
});

// ============================================
// Item Types
// ============================================

export const UserSchema = z.object({
  id: z.string(), // bigint converted to string for JSON safety
  email: z.string().email(),
  passwordHash: z.string().optional(),
  createdAt: z.date(), // timestampSeconds converted to Date
  lastModifiedAt: z.date(), // timestampSeconds converted to Date
});

export const ChatSchema = z.object({
  id: z.string(), // bigint converted to string for JSON safety
  title: z.string(),
  userId: z.string(), // bigint converted to string for JSON safety
  visibility: VisibilitySchema.optional(),
  lastContext: AppUsageSchema.optional(),
  createdAt: z.date(), // timestampSeconds converted to Date
  updatedAt: z.date(), // timestampSeconds converted to Date
});

export const MessageSchema = z.object({
  id: z.string(), // bigint converted to string for JSON safety
  chatId: z.string(), // bigint converted to string for JSON safety
  role: MessageRoleSchema,
  parts: z.array(MessagePartSchema),
  attachments: z.array(MessageAttachmentSchema).optional(),
  createdAt: z.date(), // timestampSeconds converted to Date
  createdAtVersion: z.string(), // bigint converted to string for JSON safety
});

export const VoteSchema = z.object({
  chatId: z.string(), // bigint converted to string for JSON safety
  messageId: z.string(), // bigint converted to string for JSON safety
  isUpvoted: z.boolean(),
  votedAt: z.date(), // timestampSeconds converted to Date
});

export const DocumentSchema = z.object({
  id: z.string(), // bigint converted to string for JSON safety
  userId: z.string(), // bigint converted to string for JSON safety
  title: z.string(),
  content: z.string().optional(),
  kind: DocumentKindSchema,
  createdAt: z.date(), // timestampSeconds converted to Date
  updatedAt: z.date(), // timestampSeconds converted to Date
});

export const SuggestionSchema = z.object({
  id: z.string(), // bigint converted to string for JSON safety
  documentId: z.string(), // bigint converted to string for JSON safety
  documentVersion: z.date(), // timestampSeconds converted to Date
  originalText: z.string(),
  suggestedText: z.string(),
  description: z.string().optional(),
  resolutionStatus: ResolutionStatusSchema.optional(),
  userId: z.string(), // bigint converted to string for JSON safety
  resolvedAt: z.date().optional(), // timestampSeconds converted to Date
});

export const StreamSchema = z.object({
  id: z.string(), // bigint converted to string for JSON safety
  chatId: z.string(), // bigint converted to string for JSON safety
  active: z.boolean(),
  createdAt: z.date(), // timestampSeconds converted to Date
  lastActivity: z.date(), // timestampSeconds converted to Date
});

// ============================================
// Type Exports
// ============================================

export type DocumentKind = z.infer<typeof DocumentKindSchema>;
export type MessageRole = z.infer<typeof MessageRoleSchema>;
export type ResolutionStatus = z.infer<typeof ResolutionStatusSchema>;
export type Visibility = z.infer<typeof VisibilitySchema>;

export type MessagePart = z.infer<typeof MessagePartSchema>;
export type MessageAttachment = z.infer<typeof MessageAttachmentSchema>;
export type AppUsage = z.infer<typeof AppUsageSchema>;

export type User = z.infer<typeof UserSchema>;
export type Chat = z.infer<typeof ChatSchema>;
export type Message = z.infer<typeof MessageSchema>;
export type Vote = z.infer<typeof VoteSchema>;
export type Document = z.infer<typeof DocumentSchema>;
export type Suggestion = z.infer<typeof SuggestionSchema>;
export type Stream = z.infer<typeof StreamSchema>;

