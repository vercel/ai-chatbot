-- Enhance User table
ALTER TABLE "User" 
  ADD COLUMN IF NOT EXISTS "name" varchar(100),
  ADD COLUMN IF NOT EXISTS "avatar" varchar(255),
  ADD COLUMN IF NOT EXISTS "createdAt" timestamp NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS "updatedAt" timestamp NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS "lastLoginAt" timestamp,
  ADD COLUMN IF NOT EXISTS "isActive" boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "deletedAt" timestamp,
  ADD COLUMN IF NOT EXISTS "settings" jsonb NOT NULL DEFAULT '{}';

-- Add unique constraint to email
ALTER TABLE "User" ADD CONSTRAINT "User_email_unique" UNIQUE ("email");

-- Create indexes for User table
CREATE INDEX IF NOT EXISTS "email_idx" ON "User" ("email");
CREATE INDEX IF NOT EXISTS "deleted_at_idx" ON "User" ("deletedAt");

-- Enhance Chat table
ALTER TABLE "Chat"
  ADD COLUMN IF NOT EXISTS "title" varchar(255),
  ADD COLUMN IF NOT EXISTS "createdAt" timestamp NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS "updatedAt" timestamp NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS "lastMessageAt" timestamp,
  ADD COLUMN IF NOT EXISTS "isArchived" boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "deletedAt" timestamp,
  ADD COLUMN IF NOT EXISTS "settings" jsonb NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS "metadata" jsonb NOT NULL DEFAULT '{}';

-- Create indexes for Chat table
CREATE INDEX IF NOT EXISTS "user_id_idx" ON "Chat" ("userId");
CREATE INDEX IF NOT EXISTS "last_message_at_idx" ON "Chat" ("lastMessageAt");
CREATE INDEX IF NOT EXISTS "chat_deleted_at_idx" ON "Chat" ("deletedAt"); 