-- Simplify agent prompt structure: rename basePrompt to agentPrompt and remove customPrompt (idempotent)
DO $$ BEGIN
  ALTER TABLE "Agent" RENAME COLUMN "basePrompt" TO "agentPrompt";
EXCEPTION WHEN undefined_column THEN NULL; END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "UserAgent" DROP COLUMN "customPrompt";
EXCEPTION WHEN undefined_column THEN NULL; END $$;
