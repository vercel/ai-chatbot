CREATE TABLE IF NOT EXISTS "Memory" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"content" text NOT NULL,
	"category" varchar(100) NOT NULL,
	"tags" json DEFAULT '[]'::json NOT NULL,
	"originalMessage" text,
	"originalMessageId" uuid,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "memoryCollectionEnabled" boolean DEFAULT true NOT NULL;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Memory" ADD CONSTRAINT "Memory_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
