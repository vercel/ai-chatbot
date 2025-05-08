-- Create UserPersona table
CREATE TABLE IF NOT EXISTS "UserPersona" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "userId" UUID NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "name" VARCHAR(64) NOT NULL,
  "systemMessage" TEXT,
  "persona" TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "isDefault" BOOLEAN NOT NULL DEFAULT FALSE
);

-- Create UserSettings table
CREATE TABLE IF NOT EXISTS "UserSettings" (
  "userId" UUID PRIMARY KEY NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "temperature" JSON NOT NULL DEFAULT '0.7',
  "maxTokens" JSON,
  "topP" JSON,
  "frequencyPenalty" JSON,
  "presencePenalty" JSON,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create index on userId columns
CREATE INDEX IF NOT EXISTS "UserPersona_userId_idx" ON "UserPersona" ("userId");
CREATE INDEX IF NOT EXISTS "UserSettings_userId_idx" ON "UserSettings" ("userId");

-- Add constraint to ensure only one default persona per user
CREATE UNIQUE INDEX IF NOT EXISTS "UserPersona_userId_isDefault_idx" ON "UserPersona" ("userId") WHERE "isDefault" = TRUE; 