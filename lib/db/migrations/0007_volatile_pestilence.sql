DROP TABLE "Vote_v2";--> statement-breakpoint
DROP TABLE "Vote";--> statement-breakpoint
ALTER TABLE "Document" RENAME COLUMN "text" TO "kind";--> statement-breakpoint
ALTER TABLE "Document" ADD COLUMN "authorId" uuid;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Document" ADD CONSTRAINT "Document_authorId_User_id_fk" FOREIGN KEY ("authorId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
