-- Add userId column to Agent table to track ownership
ALTER TABLE "Agent" ADD COLUMN IF NOT EXISTS "userId" UUID REFERENCES "User"("id");

-- This migration allows users to see their private agents
-- Private agents will only be visible to their creators