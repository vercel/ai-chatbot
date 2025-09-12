-- Custom migration: Agents v1
-- Keep custom migrations separate from upstream canonical set.

CREATE TABLE IF NOT EXISTS "Agent" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "slug" varchar(64) NOT NULL,
  "name" text NOT NULL,
  "description" text,
  "basePrompt" text,
  "modelId" varchar(64),
  "isPublic" boolean DEFAULT true NOT NULL,
  "createdAt" timestamp DEFAULT now() NOT NULL,
  "updatedAt" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "Agent_slug_unique" UNIQUE("slug")
);

CREATE TABLE IF NOT EXISTS "UserAgent" (
  "userId" uuid NOT NULL,
  "agentId" uuid NOT NULL,
  "customPrompt" text,
  "createdAt" timestamp DEFAULT now() NOT NULL,
  "updatedAt" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "UserAgent_userId_agentId_pk" PRIMARY KEY("userId", "agentId")
);

DO $$ BEGIN
  ALTER TABLE "UserAgent"
    ADD CONSTRAINT "UserAgent_userId_User_id_fk"
    FOREIGN KEY ("userId") REFERENCES "public"."User"("id")
    ON DELETE CASCADE ON UPDATE NO ACTION;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "UserAgent"
    ADD CONSTRAINT "UserAgent_agentId_Agent_id_fk"
    FOREIGN KEY ("agentId") REFERENCES "public"."Agent"("id")
    ON DELETE CASCADE ON UPDATE NO ACTION;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

