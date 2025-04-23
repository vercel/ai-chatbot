DROP TABLE "Message";--> statement-breakpoint
DROP TABLE "Vote";--> statement-breakpoint
ALTER TABLE "Chat" DROP CONSTRAINT "Chat_userId_User_Profiles_id_fk";
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Chat" ADD CONSTRAINT "Chat_userId_User_Profiles_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User_Profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
