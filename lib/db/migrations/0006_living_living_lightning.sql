CREATE TABLE IF NOT EXISTS "PasswordResetToken" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"token" varchar(255) NOT NULL,
	"expiresAt" timestamp NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "PasswordResetToken_token_unique" UNIQUE("token")
);
--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "name" varchar(64);--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "image" varchar(255);--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
