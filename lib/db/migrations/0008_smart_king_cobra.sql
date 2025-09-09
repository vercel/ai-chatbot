ALTER TABLE "Message_v2" ADD COLUMN "lastContext" jsonb;--> statement-breakpoint
ALTER TABLE "Chat" DROP COLUMN IF EXISTS "lastContext";