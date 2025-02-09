-- Drop existing tables if they exist
DROP TABLE IF EXISTS "Chat" CASCADE;
DROP TABLE IF EXISTS "User" CASCADE;
DROP TABLE IF EXISTS "drizzle_migrations" CASCADE;
DROP SCHEMA IF EXISTS "drizzle" CASCADE;

-- Create schema
CREATE SCHEMA IF NOT EXISTS "drizzle";

-- Create User table
CREATE TABLE "User" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "email" varchar(64) NOT NULL,
  "password" varchar(64),
  "name" varchar(100),
  "avatar" varchar(255),
  "createdAt" timestamp NOT NULL DEFAULT NOW(),
  "updatedAt" timestamp NOT NULL DEFAULT NOW(),
  "lastLoginAt" timestamp,
  "isActive" boolean NOT NULL DEFAULT true,
  "deletedAt" timestamp,
  "settings" jsonb NOT NULL DEFAULT '{}'
);

-- Create Chat table
CREATE TABLE "Chat" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "title" varchar(255),
  "createdAt" timestamp NOT NULL DEFAULT NOW(),
  "updatedAt" timestamp NOT NULL DEFAULT NOW(),
  "lastMessageAt" timestamp,
  "messages" json NOT NULL,
  "userId" uuid NOT NULL REFERENCES "User"("id"),
  "isArchived" boolean NOT NULL DEFAULT false,
  "deletedAt" timestamp,
  "settings" jsonb NOT NULL DEFAULT '{}',
  "metadata" jsonb NOT NULL DEFAULT '{}'
);

-- Add unique constraint to email
ALTER TABLE "User" ADD CONSTRAINT "User_email_unique" UNIQUE ("email");

-- Create indexes
CREATE INDEX IF NOT EXISTS "email_idx" ON "User" ("email");
CREATE INDEX IF NOT EXISTS "deleted_at_idx" ON "User" ("deletedAt");
CREATE INDEX IF NOT EXISTS "user_id_idx" ON "Chat" ("userId");
CREATE INDEX IF NOT EXISTS "last_message_at_idx" ON "Chat" ("lastMessageAt");
CREATE INDEX IF NOT EXISTS "chat_deleted_at_idx" ON "Chat" ("deletedAt"); 