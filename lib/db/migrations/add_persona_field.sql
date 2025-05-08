-- Add persona field to UserPersona table
ALTER TABLE "UserPersona" ADD COLUMN IF NOT EXISTS "persona" TEXT;

-- Update existing records to have a default persona if needed
UPDATE "UserPersona" SET "persona" = 'you are a helpful assistant' WHERE "persona" IS NULL; 