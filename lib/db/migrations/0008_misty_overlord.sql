ALTER TABLE "ReviewResponse" ALTER COLUMN "reviewerId" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "ConflictReport" ADD COLUMN "emailThreadId" varchar(255);--> statement-breakpoint
ALTER TABLE "ReviewResponse" ADD COLUMN "emailId" varchar(255);--> statement-breakpoint
ALTER TABLE "ReviewResponse" ADD COLUMN "isFromUser" boolean DEFAULT false NOT NULL;