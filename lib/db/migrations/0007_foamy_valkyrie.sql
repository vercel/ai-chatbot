ALTER TABLE "User" ADD COLUMN "walletBalance" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "isAdmin" boolean DEFAULT false NOT NULL;