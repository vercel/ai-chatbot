-- First create the Organization table
CREATE TABLE IF NOT EXISTS "Organization" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(100) NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"settings" json DEFAULT '{}'::json,
	CONSTRAINT "Organization_slug_unique" UNIQUE("slug")
);

-- Create a default organization for existing data
INSERT INTO "Organization" ("name", "slug", "createdAt") 
VALUES ('Default Organization', 'default', NOW()) 
ON CONFLICT ("slug") DO NOTHING;

-- Get the default organization ID
DO $$
DECLARE
    default_org_id uuid;
BEGIN
    SELECT id INTO default_org_id FROM "Organization" WHERE slug = 'default';
    
    -- Add organizationId columns as nullable first
    ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "organizationId" uuid;
    ALTER TABLE "Chat" ADD COLUMN IF NOT EXISTS "organizationId" uuid;
    ALTER TABLE "ConflictReport" ADD COLUMN IF NOT EXISTS "organizationId" uuid;
    ALTER TABLE "Document" ADD COLUMN IF NOT EXISTS "organizationId" uuid;
    
    -- Update existing records to use default organization
    UPDATE "User" SET "organizationId" = default_org_id WHERE "organizationId" IS NULL;
    UPDATE "Chat" SET "organizationId" = default_org_id WHERE "organizationId" IS NULL;
    UPDATE "ConflictReport" SET "organizationId" = default_org_id WHERE "organizationId" IS NULL;
    UPDATE "Document" SET "organizationId" = default_org_id WHERE "organizationId" IS NULL;
    
    -- Now make the columns NOT NULL
    ALTER TABLE "User" ALTER COLUMN "organizationId" SET NOT NULL;
    ALTER TABLE "Chat" ALTER COLUMN "organizationId" SET NOT NULL;
    ALTER TABLE "ConflictReport" ALTER COLUMN "organizationId" SET NOT NULL;
    ALTER TABLE "Document" ALTER COLUMN "organizationId" SET NOT NULL;
END $$;

-- Create OrganizationInvitation table
CREATE TABLE IF NOT EXISTS "OrganizationInvitation" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(64) NOT NULL,
	"organizationId" uuid NOT NULL,
	"inviterId" uuid NOT NULL,
	"role" varchar DEFAULT 'employee' NOT NULL,
	"status" varchar DEFAULT 'pending' NOT NULL,
	"token" varchar(255) NOT NULL,
	"expiresAt" timestamp NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"acceptedAt" timestamp,
	CONSTRAINT "OrganizationInvitation_token_unique" UNIQUE("token")
);

-- Add foreign key constraints
DO $$ BEGIN
 ALTER TABLE "OrganizationInvitation" ADD CONSTRAINT "OrganizationInvitation_organizationId_Organization_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "OrganizationInvitation" ADD CONSTRAINT "OrganizationInvitation_inviterId_User_id_fk" FOREIGN KEY ("inviterId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "Chat" ADD CONSTRAINT "Chat_organizationId_Organization_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "ConflictReport" ADD CONSTRAINT "ConflictReport_organizationId_Organization_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "Document" ADD CONSTRAINT "Document_organizationId_Organization_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "User" ADD CONSTRAINT "User_organizationId_Organization_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;