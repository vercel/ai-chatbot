CREATE TABLE IF NOT EXISTS "GoogleCredential" (
	"userId" uuid NOT NULL,
	"provider" varchar(32) DEFAULT 'google' NOT NULL,
	"accessToken" text NOT NULL,
	"refreshToken" text,
	"scope" text,
	"tokenType" varchar(32),
	"expiry" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "GoogleCredential_userId_provider_pk" PRIMARY KEY("userId","provider")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "GoogleCredential" ADD CONSTRAINT "GoogleCredential_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
