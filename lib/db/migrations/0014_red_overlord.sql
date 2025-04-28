ALTER TABLE "Chat" ALTER COLUMN "createdAt" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "Chat" ALTER COLUMN "visibility" SET DATA TYPE varchar;--> statement-breakpoint
ALTER TABLE "Message_v2" ALTER COLUMN "createdAt" DROP DEFAULT;