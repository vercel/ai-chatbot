-- Add role column to User table
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "role" varchar NOT NULL DEFAULT 'user' CHECK ("role" IN ('user', 'admin'));

-- Create index on role column for faster lookups
CREATE INDEX IF NOT EXISTS "User_role_idx" ON "User" ("role"); 