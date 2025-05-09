const { sql } = require('drizzle-orm');

module.exports.up = async function(db) {
  await db.execute(sql`
    -- Create Provider table
    CREATE TABLE IF NOT EXISTS "Provider" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "name" varchar(64) NOT NULL,
      "slug" varchar(64) NOT NULL UNIQUE,
      "apiKey" text,
      "baseUrl" text,
      "enabled" boolean NOT NULL DEFAULT true,
      "createdAt" timestamp NOT NULL DEFAULT now(),
      "updatedAt" timestamp NOT NULL DEFAULT now()
    );

    -- Create ProviderModel table
    CREATE TABLE IF NOT EXISTS "ProviderModel" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "providerId" uuid NOT NULL,
      "name" varchar(128) NOT NULL,
      "modelId" varchar(128) NOT NULL,
      "isChat" boolean NOT NULL DEFAULT true,
      "isImage" boolean NOT NULL DEFAULT false,
      "enabled" boolean NOT NULL DEFAULT true,
      "config" json,
      "createdAt" timestamp NOT NULL DEFAULT now(),
      "updatedAt" timestamp NOT NULL DEFAULT now()
    );

    -- Add foreign key constraint
    DO $$ BEGIN
     ALTER TABLE "ProviderModel" ADD CONSTRAINT "ProviderModel_providerId_Provider_id_fk" 
     FOREIGN KEY ("providerId") REFERENCES "public"."Provider"("id") ON DELETE CASCADE ON UPDATE no action;
    EXCEPTION
     WHEN duplicate_object THEN null;
    END $$;

    -- Create indexes
    CREATE INDEX IF NOT EXISTS "Provider_slug_idx" ON "Provider" ("slug");
    CREATE INDEX IF NOT EXISTS "ProviderModel_providerId_idx" ON "ProviderModel" ("providerId");
    CREATE INDEX IF NOT EXISTS "ProviderModel_enabled_idx" ON "ProviderModel" ("enabled");

    -- Seed default providers
    INSERT INTO "Provider" ("name", "slug", "enabled")
    VALUES 
    ('OpenAI', 'openai', true),
    ('xAI', 'xai', true),
    ('Anthropic', 'anthropic', false),
    ('Google', 'google', false)
    ON CONFLICT ("slug") DO NOTHING;
  `);
};

module.exports.down = async function(db) {
  await db.execute(sql`
    DROP TABLE IF EXISTS "ProviderModel";
    DROP TABLE IF EXISTS "Provider";
  `);
}; 