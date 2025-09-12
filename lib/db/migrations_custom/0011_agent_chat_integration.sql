-- Custom migration: Agent-Chat Integration
-- Add agentId column to Chat table for agent-chat linking

DO $$ BEGIN
  ALTER TABLE "Chat" ADD COLUMN "agentId" uuid;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "Chat" 
    ADD CONSTRAINT "Chat_agentId_Agent_id_fk" 
    FOREIGN KEY ("agentId") REFERENCES "public"."Agent"("id") 
    ON DELETE SET NULL ON UPDATE NO ACTION;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Add index for performance
DO $$ BEGIN
  CREATE INDEX "Chat_agentId_idx" ON "Chat"("agentId");
EXCEPTION WHEN duplicate_table THEN NULL; END $$;