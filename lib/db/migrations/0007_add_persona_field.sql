-- Add persona field to UserPersona table
ALTER TABLE "UserPersona" ADD COLUMN IF NOT EXISTS "persona" TEXT; 