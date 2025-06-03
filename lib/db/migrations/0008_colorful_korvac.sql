CREATE TABLE IF NOT EXISTS "UploadedFile" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"fileName" text NOT NULL,
	"fileType" varchar(50) NOT NULL,
	"fileSize" integer NOT NULL,
	"fileUrl" text NOT NULL,
	"mimeType" varchar(100),
	"parsedContent" text,
	"parsingStatus" varchar DEFAULT 'pending' NOT NULL,
	"parsingError" text,
	"uploadedAt" timestamp DEFAULT now() NOT NULL,
	"parsedAt" timestamp
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "UploadedFile" ADD CONSTRAINT "UploadedFile_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
