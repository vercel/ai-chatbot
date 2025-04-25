-- ALTER TABLE "Document" DROP CONSTRAINT "Document_userId_User_Profiles_id_fk";
--> statement-breakpoint
ALTER TABLE "User_Profiles" ADD COLUMN "clerk_id" text;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Document" ADD CONSTRAINT "Document_userId_User_Profiles_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User_Profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "User_Profiles" ADD CONSTRAINT "User_Profiles_clerk_id_unique" UNIQUE("clerk_id");