ALTER TABLE "Message" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "Vote" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "Message" CASCADE;--> statement-breakpoint
DROP TABLE "Vote" CASCADE;--> statement-breakpoint
ALTER TABLE "Chat" RENAME TO "chats";--> statement-breakpoint
ALTER TABLE "Document" RENAME TO "documents";--> statement-breakpoint
ALTER TABLE "Message_v2" RENAME TO "messages";--> statement-breakpoint
ALTER TABLE "Stream" RENAME TO "streams";--> statement-breakpoint
ALTER TABLE "Suggestion" RENAME TO "suggestions";--> statement-breakpoint
ALTER TABLE "User" RENAME TO "users";--> statement-breakpoint
ALTER TABLE "Vote_v2" RENAME TO "votes";--> statement-breakpoint
ALTER TABLE "chats" RENAME COLUMN "createdAt" TO "created_at";--> statement-breakpoint
ALTER TABLE "chats" RENAME COLUMN "userId" TO "user_id";--> statement-breakpoint
ALTER TABLE "chats" RENAME COLUMN "lastContext" TO "last_context";--> statement-breakpoint
ALTER TABLE "documents" RENAME COLUMN "createdAt" TO "created_at";--> statement-breakpoint
ALTER TABLE "documents" RENAME COLUMN "userId" TO "user_id";--> statement-breakpoint
ALTER TABLE "messages" RENAME COLUMN "chatId" TO "chat_id";--> statement-breakpoint
ALTER TABLE "messages" RENAME COLUMN "createdAt" TO "created_at";--> statement-breakpoint
ALTER TABLE "streams" RENAME COLUMN "chatId" TO "chat_id";--> statement-breakpoint
ALTER TABLE "streams" RENAME COLUMN "createdAt" TO "created_at";--> statement-breakpoint
ALTER TABLE "suggestions" RENAME COLUMN "documentId" TO "document_id";--> statement-breakpoint
ALTER TABLE "suggestions" RENAME COLUMN "documentCreatedAt" TO "document_created_at";--> statement-breakpoint
ALTER TABLE "suggestions" RENAME COLUMN "originalText" TO "original_text";--> statement-breakpoint
ALTER TABLE "suggestions" RENAME COLUMN "suggestedText" TO "suggested_text";--> statement-breakpoint
ALTER TABLE "suggestions" RENAME COLUMN "isResolved" TO "is_resolved";--> statement-breakpoint
ALTER TABLE "suggestions" RENAME COLUMN "userId" TO "user_id";--> statement-breakpoint
ALTER TABLE "suggestions" RENAME COLUMN "createdAt" TO "created_at";--> statement-breakpoint
ALTER TABLE "votes" RENAME COLUMN "chatId" TO "chat_id";--> statement-breakpoint
ALTER TABLE "votes" RENAME COLUMN "messageId" TO "message_id";--> statement-breakpoint
ALTER TABLE "votes" RENAME COLUMN "isUpvoted" TO "is_upvoted";--> statement-breakpoint
ALTER TABLE "chats" DROP CONSTRAINT "Chat_userId_User_id_fk";
--> statement-breakpoint
ALTER TABLE "documents" DROP CONSTRAINT "Document_userId_User_id_fk";
--> statement-breakpoint
ALTER TABLE "messages" DROP CONSTRAINT "Message_v2_chatId_Chat_id_fk";
--> statement-breakpoint
ALTER TABLE "streams" DROP CONSTRAINT "Stream_chatId_Chat_id_fk";
--> statement-breakpoint
ALTER TABLE "suggestions" DROP CONSTRAINT "Suggestion_userId_User_id_fk";
--> statement-breakpoint
ALTER TABLE "suggestions" DROP CONSTRAINT "Suggestion_documentId_documentCreatedAt_Document_id_createdAt_fk";
--> statement-breakpoint
ALTER TABLE "votes" DROP CONSTRAINT "Vote_v2_chatId_Chat_id_fk";
--> statement-breakpoint
ALTER TABLE "votes" DROP CONSTRAINT "Vote_v2_messageId_Message_v2_id_fk";
--> statement-breakpoint
ALTER TABLE "documents" DROP CONSTRAINT "Document_id_createdAt_pk";--> statement-breakpoint
ALTER TABLE "streams" DROP CONSTRAINT "Stream_id_pk";--> statement-breakpoint
ALTER TABLE "suggestions" DROP CONSTRAINT "Suggestion_id_pk";--> statement-breakpoint
ALTER TABLE "votes" DROP CONSTRAINT "Vote_v2_chatId_messageId_pk";--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_id_created_at_pk" PRIMARY KEY("id","created_at");--> statement-breakpoint
ALTER TABLE "streams" ADD CONSTRAINT "streams_id_pk" PRIMARY KEY("id");--> statement-breakpoint
ALTER TABLE "suggestions" ADD CONSTRAINT "suggestions_id_pk" PRIMARY KEY("id");--> statement-breakpoint
ALTER TABLE "votes" ADD CONSTRAINT "votes_chat_id_message_id_pk" PRIMARY KEY("chat_id","message_id");--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "onboarding_completed" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "chats" ADD CONSTRAINT "chats_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_chat_id_chats_id_fk" FOREIGN KEY ("chat_id") REFERENCES "public"."chats"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "streams" ADD CONSTRAINT "streams_chat_id_chats_id_fk" FOREIGN KEY ("chat_id") REFERENCES "public"."chats"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "suggestions" ADD CONSTRAINT "suggestions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "suggestions" ADD CONSTRAINT "suggestions_document_id_document_created_at_documents_id_created_at_fk" FOREIGN KEY ("document_id","document_created_at") REFERENCES "public"."documents"("id","created_at") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "votes" ADD CONSTRAINT "votes_chat_id_chats_id_fk" FOREIGN KEY ("chat_id") REFERENCES "public"."chats"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "votes" ADD CONSTRAINT "votes_message_id_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."messages"("id") ON DELETE no action ON UPDATE no action;