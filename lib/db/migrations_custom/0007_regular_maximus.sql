ALTER TABLE "User" ADD COLUMN "slackUserId" varchar(32);--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "user_slack_id_unique" ON "User"("slackUserId");