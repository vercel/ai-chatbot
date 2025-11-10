-- Migration: Convert all tables and columns to snake_case naming convention
-- Also removes deprecated tables (Message, Vote) as we're using AI SDK 5 message parts format

-- Drop deprecated tables and their constraints first
DROP TABLE IF EXISTS "Vote" CASCADE;
DROP TABLE IF EXISTS "Message" CASCADE;

-- Rename tables to snake_case
ALTER TABLE IF EXISTS "User" RENAME TO "users";
ALTER TABLE IF EXISTS "Chat" RENAME TO "chats";
ALTER TABLE IF EXISTS "Message_v2" RENAME TO "messages";
ALTER TABLE IF EXISTS "Vote_v2" RENAME TO "votes";
ALTER TABLE IF EXISTS "Document" RENAME TO "documents";
ALTER TABLE IF EXISTS "Suggestion" RENAME TO "suggestions";
ALTER TABLE IF EXISTS "Stream" RENAME TO "streams";

-- Rename columns in users table (no columns to rename, already snake_case)

-- Rename columns in chats table
ALTER TABLE "chats" RENAME COLUMN "createdAt" TO "created_at";
ALTER TABLE "chats" RENAME COLUMN "userId" TO "user_id";
ALTER TABLE "chats" RENAME COLUMN "lastContext" TO "last_context";

-- Rename columns in messages table
ALTER TABLE "messages" RENAME COLUMN "chatId" TO "chat_id";
ALTER TABLE "messages" RENAME COLUMN "createdAt" TO "created_at";

-- Rename columns in votes table
ALTER TABLE "votes" RENAME COLUMN "chatId" TO "chat_id";
ALTER TABLE "votes" RENAME COLUMN "messageId" TO "message_id";
ALTER TABLE "votes" RENAME COLUMN "isUpvoted" TO "is_upvoted";

-- Rename columns in documents table
ALTER TABLE "documents" RENAME COLUMN "createdAt" TO "created_at";
ALTER TABLE "documents" RENAME COLUMN "userId" TO "user_id";

-- Rename columns in suggestions table
ALTER TABLE "suggestions" RENAME COLUMN "documentId" TO "document_id";
ALTER TABLE "suggestions" RENAME COLUMN "documentCreatedAt" TO "document_created_at";
ALTER TABLE "suggestions" RENAME COLUMN "originalText" TO "original_text";
ALTER TABLE "suggestions" RENAME COLUMN "suggestedText" TO "suggested_text";
ALTER TABLE "suggestions" RENAME COLUMN "isResolved" TO "is_resolved";
ALTER TABLE "suggestions" RENAME COLUMN "userId" TO "user_id";
ALTER TABLE "suggestions" RENAME COLUMN "createdAt" TO "created_at";

-- Rename columns in streams table
ALTER TABLE "streams" RENAME COLUMN "chatId" TO "chat_id";
ALTER TABLE "streams" RENAME COLUMN "createdAt" TO "created_at";

-- Drop old foreign key constraints (they will be recreated with new names)
DO $$ 
BEGIN
    -- Drop foreign keys from chats
    ALTER TABLE "chats" DROP CONSTRAINT IF EXISTS "Chat_userId_User_id_fk";
    
    -- Drop foreign keys from messages
    ALTER TABLE "messages" DROP CONSTRAINT IF EXISTS "Message_v2_chatId_Chat_id_fk";
    
    -- Drop foreign keys from votes
    ALTER TABLE "votes" DROP CONSTRAINT IF EXISTS "Vote_v2_chatId_Chat_id_fk";
    ALTER TABLE "votes" DROP CONSTRAINT IF EXISTS "Vote_v2_messageId_Message_v2_id_fk";
    
    -- Drop foreign keys from documents
    ALTER TABLE "documents" DROP CONSTRAINT IF EXISTS "Document_userId_User_id_fk";
    
    -- Drop foreign keys from suggestions
    ALTER TABLE "suggestions" DROP CONSTRAINT IF EXISTS "Suggestion_userId_User_id_fk";
    ALTER TABLE "suggestions" DROP CONSTRAINT IF EXISTS "Suggestion_documentId_documentCreatedAt_Document_id_createdAt_fk";
    
    -- Drop foreign keys from streams
    ALTER TABLE "streams" DROP CONSTRAINT IF EXISTS "Stream_chatId_Chat_id_fk";
END $$;

-- Recreate foreign key constraints with new names
DO $$ BEGIN
    ALTER TABLE "chats" ADD CONSTRAINT "chats_user_id_users_id_fk" 
        FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "messages" ADD CONSTRAINT "messages_chat_id_chats_id_fk" 
        FOREIGN KEY ("chat_id") REFERENCES "public"."chats"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "votes" ADD CONSTRAINT "votes_chat_id_chats_id_fk" 
        FOREIGN KEY ("chat_id") REFERENCES "public"."chats"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "votes" ADD CONSTRAINT "votes_message_id_messages_id_fk" 
        FOREIGN KEY ("message_id") REFERENCES "public"."messages"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "documents" ADD CONSTRAINT "documents_user_id_users_id_fk" 
        FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "suggestions" ADD CONSTRAINT "suggestions_user_id_users_id_fk" 
        FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "suggestions" ADD CONSTRAINT "suggestions_document_id_document_created_at_documents_id_created_at_fk" 
        FOREIGN KEY ("document_id", "document_created_at") REFERENCES "public"."documents"("id", "created_at") ON DELETE no action ON UPDATE no action;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "streams" ADD CONSTRAINT "streams_chat_id_chats_id_fk" 
        FOREIGN KEY ("chat_id") REFERENCES "public"."chats"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Drop old primary key constraints and recreate with new names
DO $$ 
BEGIN
    -- Drop old primary key constraint names (if they exist)
    ALTER TABLE "votes" DROP CONSTRAINT IF EXISTS "Vote_v2_chatId_messageId_pk";
    ALTER TABLE "documents" DROP CONSTRAINT IF EXISTS "Document_id_createdAt_pk";
    ALTER TABLE "suggestions" DROP CONSTRAINT IF EXISTS "Suggestion_id_pk";
    ALTER TABLE "streams" DROP CONSTRAINT IF EXISTS "Stream_id_pk";
END $$;

-- Recreate primary key constraints with new names
ALTER TABLE "votes" ADD CONSTRAINT "votes_chat_id_message_id_pk" PRIMARY KEY("chat_id", "message_id");
ALTER TABLE "documents" ADD CONSTRAINT "documents_id_created_at_pk" PRIMARY KEY("id", "created_at");
ALTER TABLE "suggestions" ADD CONSTRAINT "suggestions_id_pk" PRIMARY KEY("id");
ALTER TABLE "streams" ADD CONSTRAINT "streams_id_pk" PRIMARY KEY("id");

