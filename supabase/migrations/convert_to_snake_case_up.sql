-- UP MIGRATION: Convert to plural snake_case

-- Rename Tables
ALTER TABLE "public"."User_Profiles" RENAME TO "user_profiles";
ALTER TABLE "public"."Chat" RENAME TO "chats";
ALTER TABLE "public"."Document" RENAME TO "documents";
ALTER TABLE "public"."Suggestion" RENAME TO "suggestions";
ALTER TABLE "public"."Message_v2" RENAME TO "messages"; -- Renaming V2 table for consistency
ALTER TABLE "public"."Vote_v2" RENAME TO "votes"; -- Renaming V2 table for consistency

-- Rename Columns in suggestions Table (was Suggestion)
ALTER TABLE "public"."suggestions" RENAME COLUMN "userId" TO "user_id";
ALTER TABLE "public"."suggestions" RENAME COLUMN "documentId" TO "document_id";
ALTER TABLE "public"."suggestions" RENAME COLUMN "documentCreatedAt" TO "document_created_at";
ALTER TABLE "public"."suggestions" RENAME COLUMN "originalText" TO "original_text";
ALTER TABLE "public"."suggestions" RENAME COLUMN "suggestedText" TO "suggested_text";
ALTER TABLE "public"."suggestions" RENAME COLUMN "isResolved" TO "is_resolved";
ALTER TABLE "public"."suggestions" RENAME COLUMN "createdAt" TO "created_at";

-- Rename Columns in documents Table (was Document)
ALTER TABLE "public"."documents" RENAME COLUMN "userId" TO "user_id";
ALTER TABLE "public"."documents" RENAME COLUMN "createdAt" TO "created_at";
ALTER TABLE "public"."documents" RENAME COLUMN "modifiedAt" TO "modified_at";
-- chat_id already exists as snake_case

-- Rename Columns in user_profiles Table (was User_Profiles)
-- All relevant columns seem to be already snake_case based on schema dump (clerk_id, created_at, modified_at, etc.)
-- No column renames needed here based on current info.

-- Rename Columns in chats Table (was Chat)
ALTER TABLE "public"."chats" RENAME COLUMN "userId" TO "user_id";
ALTER TABLE "public"."chats" RENAME COLUMN "createdAt" TO "created_at";

-- Rename Columns in messages Table (was Message_v2)
ALTER TABLE "public"."messages" RENAME COLUMN "chatId" TO "chat_id";
ALTER TABLE "public"."messages" RENAME COLUMN "createdAt" TO "created_at";

-- Rename Columns in votes Table (was Vote_v2)
ALTER TABLE "public"."votes" RENAME COLUMN "chatId" TO "chat_id";
ALTER TABLE "public"."votes" RENAME COLUMN "messageId" TO "message_id";
ALTER TABLE "public"."votes" RENAME COLUMN "isUpvoted" TO "is_upvoted";

-- Note: Foreign key constraints, indexes, triggers, RLS policies etc.
-- might need updating if they explicitly reference renamed columns/tables by name.
-- Supabase/Postgres often handles basic renames gracefully for FKs, but complex dependencies should be checked.
-- RLS policies were checked and use descriptive names, not identifiers.
-- Functions/Triggers were checked and seemed to use snake_case already. 