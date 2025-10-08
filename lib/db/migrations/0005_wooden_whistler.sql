CREATE TABLE IF NOT EXISTS "Message_v2" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"chatId" uuid NOT NULL,
	"role" varchar NOT NULL,
	"parts" json NOT NULL,
	"attachments" json NOT NULL,
	"createdAt" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "Vote_v2" (
	"chatId" uuid NOT NULL,
	"messageId" uuid NOT NULL,
	"isUpvoted" boolean NOT NULL,
	CONSTRAINT "Vote_v2_chatId_messageId_pk" PRIMARY KEY("chatId","messageId")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Message_v2" ADD CONSTRAINT "Message_v2_chatId_Chat_id_fk" FOREIGN KEY ("chatId") REFERENCES "public"."Chat"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Vote_v2" ADD CONSTRAINT "Vote_v2_chatId_Chat_id_fk" FOREIGN KEY ("chatId") REFERENCES "public"."Chat"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Vote_v2" ADD CONSTRAINT "Vote_v2_messageId_Message_v2_id_fk" FOREIGN KEY ("messageId") REFERENCES "public"."Message_v2"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
