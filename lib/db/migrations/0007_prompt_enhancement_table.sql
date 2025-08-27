CREATE TABLE IF NOT EXISTS "PromptEnhancement" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"messageId" uuid NOT NULL,
	"originalPrompt" text NOT NULL,
	"enhancedPrompt" text NOT NULL,
	"confidence" json NOT NULL,
	"changes" json NOT NULL,
	"analysis" json NOT NULL,
	"processingTime" json NOT NULL,
	"enhancementType" varchar DEFAULT 'hybrid' NOT NULL,
	"createdAt" timestamp NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "PromptEnhancement" ADD CONSTRAINT "PromptEnhancement_messageId_Message_v2_id_fk" FOREIGN KEY ("messageId") REFERENCES "Message_v2"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;