-- Add Agent.userId with FK; idempotent guard for reruns
DO $$ BEGIN
  ALTER TABLE "Agent" ADD COLUMN "userId" uuid;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;--> statement-breakpoint

DO $$ BEGIN
  ALTER TABLE "Agent" ADD CONSTRAINT "Agent_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;--> statement-breakpoint