-- Add invitation system fields to User table
ALTER TABLE "User" 
ADD COLUMN IF NOT EXISTS "invitedBy" UUID REFERENCES "User"(id),
ADD COLUMN IF NOT EXISTS "isAdmin" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP NOT NULL DEFAULT NOW();

-- Create Invitation table
CREATE TABLE IF NOT EXISTS "Invitation" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "email" VARCHAR(64) NOT NULL,
  "invitedBy" UUID NOT NULL REFERENCES "User"(id),
  "token" VARCHAR(255) NOT NULL UNIQUE,
  "status" VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK ("status" IN ('pending', 'accepted', 'expired', 'revoked')),
  "expiresAt" TIMESTAMP NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "acceptedAt" TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_invitation_email ON "Invitation"("email");
CREATE INDEX IF NOT EXISTS idx_invitation_token ON "Invitation"("token");
CREATE INDEX IF NOT EXISTS idx_invitation_status ON "Invitation"("status");
CREATE INDEX IF NOT EXISTS idx_user_invitedBy ON "User"("invitedBy");

-- Make the first user an admin (optional - you can set this manually)
-- UPDATE "User" SET "isAdmin" = true WHERE "email" = 'your-admin-email@example.com';