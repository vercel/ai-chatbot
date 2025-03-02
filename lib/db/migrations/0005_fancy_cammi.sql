-- Removed vector extension due to installation issue
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "KnowledgeChunk" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"documentId" uuid NOT NULL,
	"content" text NOT NULL,
	"metadata" json,
	"chunkIndex" varchar(20) NOT NULL,
	"embedding" text, -- Changed from vector(1536) to text as a temporary solution
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "KnowledgeDocument" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"sourceType" varchar NOT NULL,
	"sourceUrl" text,
	"fileSize" varchar(20),
	"fileType" varchar(50),
	"status" varchar DEFAULT 'processing' NOT NULL,
	"processingError" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "KnowledgeReference" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"messageId" uuid NOT NULL,
	"chunkId" uuid NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "KnowledgeChunk" ADD CONSTRAINT "KnowledgeChunk_documentId_KnowledgeDocument_id_fk" FOREIGN KEY ("documentId") REFERENCES "public"."KnowledgeDocument"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "KnowledgeDocument" ADD CONSTRAINT "KnowledgeDocument_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "KnowledgeReference" ADD CONSTRAINT "KnowledgeReference_messageId_Message_id_fk" FOREIGN KEY ("messageId") REFERENCES "public"."Message"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "KnowledgeReference" ADD CONSTRAINT "KnowledgeReference_chunkId_KnowledgeChunk_id_fk" FOREIGN KEY ("chunkId") REFERENCES "public"."KnowledgeChunk"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "documentId_idx" ON "KnowledgeChunk" USING btree ("documentId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "message_chunk_idx" ON "KnowledgeReference" USING btree ("messageId","chunkId");