CREATE TABLE IF NOT EXISTS "ConflictReport" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userEmail" varchar(64) NOT NULL,
	"documentId" uuid NOT NULL,
	"content" text NOT NULL,
	"status" varchar DEFAULT 'pending' NOT NULL,
	"priority" varchar DEFAULT 'medium' NOT NULL,
	"submittedAt" timestamp NOT NULL,
	"reviewedAt" timestamp,
	"reviewerId" uuid
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ReviewResponse" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conflictReportId" uuid NOT NULL,
	"reviewerId" uuid NOT NULL,
	"actionType" varchar NOT NULL,
	"responseContent" text NOT NULL,
	"createdAt" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "role" varchar DEFAULT 'employee' NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ConflictReport" ADD CONSTRAINT "ConflictReport_reviewerId_User_id_fk" FOREIGN KEY ("reviewerId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ReviewResponse" ADD CONSTRAINT "ReviewResponse_conflictReportId_ConflictReport_id_fk" FOREIGN KEY ("conflictReportId") REFERENCES "public"."ConflictReport"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ReviewResponse" ADD CONSTRAINT "ReviewResponse_reviewerId_User_id_fk" FOREIGN KEY ("reviewerId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
