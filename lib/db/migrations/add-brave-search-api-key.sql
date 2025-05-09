-- Add braveSearchApiKey column to SystemSettings table
ALTER TABLE "SystemSettings" ADD COLUMN IF NOT EXISTS "braveSearchApiKey" TEXT; 