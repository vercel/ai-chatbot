DO $$ BEGIN
  ALTER TABLE "User" ADD COLUMN "slackUserId" varchar(32);
EXCEPTION WHEN duplicate_column THEN NULL; END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "user_slack_id_unique" ON "User"("slackUserId");

