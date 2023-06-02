CREATE TABLE IF NOT EXISTS "chats" (
	"id" text PRIMARY KEY NOT NULL,
	"role" text NOT NULL,
	"userId" text NOT NULL,
	"messages" json DEFAULT '{}'::json NOT NULL
);
