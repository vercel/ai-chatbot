CREATE TABLE IF NOT EXISTS "tables"(
    "id" text PRIMARY KEY NOT NULL,
    "workspace_id" uuid NOT NULL,
    "name" text NOT NULL,
    "description" text,
    "config" jsonb NOT NULL DEFAULT '{}' ::jsonb,
    "created_by" uuid,
    "created_at" timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    "updated_at" timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT "tables_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE CASCADE,
    CONSTRAINT "tables_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id"),
    CONSTRAINT "tables_name_not_empty" CHECK ((char_length(btrim(COALESCE("name", ''::text))) > 0))
);

--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tables_workspace_id_idx" ON "tables" USING btree("workspace_id");

--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tables_created_by_idx" ON "tables" USING btree("created_by");

