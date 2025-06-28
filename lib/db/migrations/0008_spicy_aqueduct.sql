CREATE TABLE IF NOT EXISTS "Resource" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_type" varchar(50) NOT NULL,
	"source_uri" text NOT NULL,
	"content_hash" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "Resource_source_uri_unique" UNIQUE("source_uri")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ResourceChunk" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"resource_id" uuid NOT NULL,
	"content" text NOT NULL,
	"embedding" vector(1536)
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ResourceChunk" ADD CONSTRAINT "ResourceChunk_resource_id_Resource_id_fk" FOREIGN KEY ("resource_id") REFERENCES "public"."Resource"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "embedding_index" ON "ResourceChunk" USING hnsw ("embedding" vector_cosine_ops);