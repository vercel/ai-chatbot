ALTER TABLE "User" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "User" DROP COLUMN IF EXISTS "password";