-- DOWN MIGRATION: Revert to original PascalCase/camelCase

-- Rename Columns in votes Table (reverting)
ALTER TABLE "public"."votes" RENAME COLUMN "chat_id" TO "chatId";
ALTER TABLE "public"."votes" RENAME COLUMN "message_id" TO "messageId";
ALTER TABLE "public"."votes" RENAME COLUMN "is_upvoted" TO "isUpvoted";

-- Rename Columns in messages Table (reverting)
ALTER TABLE "public"."messages" RENAME COLUMN "chat_id" TO "chatId";
ALTER TABLE "public"."messages" RENAME COLUMN "created_at" TO "createdAt";

-- Rename Columns in chats Table (reverting)
ALTER TABLE "public"."chats" RENAME COLUMN "user_id" TO "userId";
ALTER TABLE "public"."chats" RENAME COLUMN "created_at" TO "createdAt";

-- Rename Columns in user_profiles Table (reverting)
-- No columns were renamed in the UP script based on current info.

-- Rename Columns in documents Table (reverting)
ALTER TABLE "public"."documents" RENAME COLUMN "user_id" TO "userId";
ALTER TABLE "public"."documents" RENAME COLUMN "created_at" TO "createdAt";
ALTER TABLE "public"."documents" RENAME COLUMN "modified_at" TO "modifiedAt";

-- Rename Columns in suggestions Table (reverting)
ALTER TABLE "public"."suggestions" RENAME COLUMN "user_id" TO "userId";
ALTER TABLE "public"."suggestions" RENAME COLUMN "document_id" TO "documentId";
ALTER TABLE "public"."suggestions" RENAME COLUMN "document_created_at" TO "documentCreatedAt";
ALTER TABLE "public"."suggestions" RENAME COLUMN "original_text" TO "originalText";
ALTER TABLE "public"."suggestions" RENAME COLUMN "suggested_text" TO "suggestedText";
ALTER TABLE "public"."suggestions" RENAME COLUMN "is_resolved" TO "isResolved";
ALTER TABLE "public"."suggestions" RENAME COLUMN "created_at" TO "createdAt";

-- Rename Tables (reverting)
ALTER TABLE "public"."user_profiles" RENAME TO "User_Profiles";
ALTER TABLE "public"."chats" RENAME TO "Chat";
ALTER TABLE "public"."documents" RENAME TO "Document";
ALTER TABLE "public"."suggestions" RENAME TO "Suggestion";
ALTER TABLE "public"."messages" RENAME TO "Message_v2";
ALTER TABLE "public"."votes" RENAME TO "Vote_v2";

-- Note: Similar caution applies regarding dependencies. 