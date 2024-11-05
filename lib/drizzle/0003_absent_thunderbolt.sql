ALTER TABLE "Chat" ADD COLUMN "agentId" uuid;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Chat" ADD CONSTRAINT "Chat_agentId_Agent_id_fk" FOREIGN KEY ("agentId") REFERENCES "public"."Agent"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
