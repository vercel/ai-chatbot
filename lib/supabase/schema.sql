-- Create tables for the chatbot application

-- User table
CREATE TABLE IF NOT EXISTS "User" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "email" VARCHAR(64) NOT NULL,
  "password" VARCHAR(64)
);

-- Chat table
CREATE TABLE IF NOT EXISTS "Chat" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "createdAt" TIMESTAMP NOT NULL,
  "title" TEXT NOT NULL,
  "userId" UUID NOT NULL REFERENCES "User"("id"),
  "visibility" VARCHAR DEFAULT 'private' CHECK ("visibility" IN ('public', 'private')),
  "lastContext" JSONB
);

-- Message table (v2)
CREATE TABLE IF NOT EXISTS "Message_v2" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "chatId" UUID NOT NULL REFERENCES "Chat"("id"),
  "role" VARCHAR NOT NULL,
  "parts" JSON NOT NULL,
  "attachments" JSON NOT NULL,
  "createdAt" TIMESTAMP NOT NULL
);

-- Vote table (v2)
CREATE TABLE IF NOT EXISTS "Vote_v2" (
  "chatId" UUID NOT NULL REFERENCES "Chat"("id"),
  "messageId" UUID NOT NULL REFERENCES "Message_v2"("id"),
  "isUpvoted" BOOLEAN NOT NULL,
  PRIMARY KEY ("chatId", "messageId")
);

-- Document table
CREATE TABLE IF NOT EXISTS "Document" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "createdAt" TIMESTAMP NOT NULL,
  "title" TEXT NOT NULL,
  "content" TEXT,
  "kind" VARCHAR DEFAULT 'text' CHECK ("kind" IN ('text', 'code', 'image', 'sheet')),
  "userId" UUID NOT NULL REFERENCES "User"("id"),
  PRIMARY KEY ("id", "createdAt")
);

-- Suggestion table
CREATE TABLE IF NOT EXISTS "Suggestion" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "documentId" UUID NOT NULL,
  "documentCreatedAt" TIMESTAMP NOT NULL,
  "originalText" TEXT NOT NULL,
  "suggestedText" TEXT NOT NULL,
  "description" TEXT,
  "isResolved" BOOLEAN NOT NULL DEFAULT FALSE,
  "userId" UUID NOT NULL REFERENCES "User"("id"),
  "createdAt" TIMESTAMP NOT NULL,
  FOREIGN KEY ("documentId", "documentCreatedAt") REFERENCES "Document"("id", "createdAt")
);

-- Stream table
CREATE TABLE IF NOT EXISTS "Stream" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "chatId" UUID NOT NULL REFERENCES "Chat"("id"),
  "createdAt" TIMESTAMP NOT NULL
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS "Chat_userId_idx" ON "Chat"("userId");
CREATE INDEX IF NOT EXISTS "Message_v2_chatId_idx" ON "Message_v2"("chatId");
CREATE INDEX IF NOT EXISTS "Document_userId_idx" ON "Document"("userId");
CREATE INDEX IF NOT EXISTS "Suggestion_documentId_idx" ON "Suggestion"("documentId");
CREATE INDEX IF NOT EXISTS "Stream_chatId_idx" ON "Stream"("chatId");
