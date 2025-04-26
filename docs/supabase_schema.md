# Database Schema Documentation

This document outlines the tables found in the Supabase project `dvlcpljodhsfrucieoqd`, updated as of 2025-04-27. Tables are grouped by schema.

*(Note: Live row estimates, sizes, and dead row counts are snapshots and may change frequently.)*

---

## Schema: `public`

Custom application tables.

### Table: `Suggestion`

-   **Comment**: null
-   **RLS Enabled**: true
-   **Primary Key(s)**: `id` (uuid)
-   **Foreign Keys**:
    -   `(documentId)` -> `public.Document(id)`
    -   `(documentCreatedAt)` -> `public.Document(createdAt)` *(Note: This seems unusual, linking only to createdAt)*
    -   `(userId)` -> `public.User_Profiles(id)`
    -   `(userId)` -> `auth.users(id)`
-   **Columns**:
    -   `id` (uuid, default: `gen_random_uuid()`)
    -   `documentId` (uuid)
    -   `documentCreatedAt` (timestamp without time zone)
    -   `originalText` (text)
    -   `suggestedText` (text)
    -   `description` (text, nullable)
    -   `isResolved` (boolean, default: `false`)
    -   `userId` (uuid)
    -   `createdAt` (timestamp without time zone)

### Table: `Document`

-   **Comment**: null
-   **RLS Enabled**: true
-   **Primary Key(s)**: `id` (uuid), `createdAt` (timestamp without time zone) *(Note: Composite PK)*
-   **Foreign Keys**:
    -   `(userId)` -> `public.User_Profiles(id)`
    -   `(chat_id)` -> `public.Chat(id)`
-   **Incoming FKs**:
    -   `public.Suggestion(documentId)` -> `(id)`
    -   `public.Suggestion(documentCreatedAt)` -> `(createdAt)`
-   **Columns**:
    -   `id` (uuid, default: `gen_random_uuid()`, is_unique: true)
    -   `createdAt` (timestamp without time zone)
    -   `title` (text)
    -   `content` (text, nullable)
    -   `userId` (uuid)
    -   `kind` (character varying, default: `'text'::character varying`, check: `kind` in ('text', 'code', 'image', 'sheet', 'textv2'))
    -   `tags` (ARRAY, _text, nullable, default: `ARRAY[]::text[]`)
    -   `modifiedAt` (timestamp with time zone, nullable, default: `now()`)
    -   `chat_id` (uuid, nullable)
    -   `content_json` (jsonb, nullable)

### Table: `User_Profiles`

-   **Comment**: null
-   **RLS Enabled**: true
-   **Primary Key(s)**: `id` (uuid)
-   **Incoming FKs**:
    -   `public.Document(userId)` -> `(id)`
    -   `public.Chat(userId)` -> `(id)`
    -   `public.Suggestion(userId)` -> `(id)`
-   **Columns**:
    -   `id` (uuid, default: `gen_random_uuid()`)
    -   `created_at` (timestamp with time zone, default: `now()`)
    -   `modified_at` (timestamp with time zone, nullable, default: `now()`)
    -   `google_refresh_token` (text, nullable)
    -   `email` (character varying, nullable)
    -   `pdl_person_data` (jsonb, nullable)
    -   `pdl_org_data` (jsonb, nullable)
    -   `person_deep_research_data` (text, nullable)
    -   `org_deep_research_data` (text, nullable)
    -   `org_website_scrape` (text, nullable)
    -   `clerk_id` (text, nullable, is_unique: true)

### Table: `Chat`

-   **Comment**: null
-   **RLS Enabled**: false
-   **Primary Key(s)**: `id` (uuid)
-   **Foreign Keys**:
    -   `(userId)` -> `public.User_Profiles(id)`
-   **Incoming FKs**:
    -   `public.Document(chat_id)` -> `(id)`
    -   `public.Message_v2(chatId)` -> `(id)`
    -   `public.Vote_v2(chatId)` -> `(id)`
-   **Columns**:
    -   `id` (uuid, default: `gen_random_uuid()`)
    -   `createdAt` (timestamp without time zone)
    -   `title` (text)
    -   `userId` (uuid)
    -   `visibility` (character varying, default: `'private'::character varying`, check: `visibility` in ('public', 'private'))

### Table: `Message_v2`

-   **Comment**: null
-   **RLS Enabled**: false
-   **Primary Key(s)**: `id` (uuid)
-   **Foreign Keys**:
    -   `(chatId)` -> `public.Chat(id)`
-   **Incoming FKs**:
    -   `public.Vote_v2(messageId)` -> `(id)`
-   **Columns**:
    -   `id` (uuid, default: `gen_random_uuid()`)
    -   `chatId` (uuid)
    -   `role` (character varying)
    -   `parts` (json)
    -   `attachments` (json)
    -   `createdAt` (timestamp without time zone)

### Table: `Vote_v2`

-   **Comment**: null
-   **RLS Enabled**: false
-   **Primary Key(s)**: `chatId` (uuid), `messageId` (uuid) *(Note: Composite PK)*
-   **Foreign Keys**:
    -   `(chatId)` -> `public.Chat(id)`
    -   `(messageId)` -> `public.Message_v2(id)`
-   **Columns**:
    -   `chatId` (uuid)
    -   `messageId` (uuid)
    -   `isUpvoted` (boolean)

---

## Schema: `supabase_migrations`

Schema used by Supabase Studio/CLI for tracking its migrations.

-   `schema_migrations`: Tracks schema migrations applied by Supabase. (RLS: false)

---

## Schema: `net`

Schema for the `pg_net` extension (enables outbound HTTP requests from Postgres).

-   `http_request_queue`: Internal queue for `pg_net`. (RLS: false)
-   `_http_response`: Internal table for `pg_net` responses. (RLS: false)

---


## Schema: `storage`

Standard Supabase Storage schema for managing file storage.

-   `buckets`: Stores storage bucket configuration. (RLS: true)
-   `objects`: Stores metadata about individual storage objects. (RLS: true)
-   `migrations`: Manages updates to the storage schema. (RLS: true)
-   `s3_multipart_uploads`: Tracks S3 multipart uploads in progress. (RLS: true)
-   `s3_multipart_uploads_parts`: Tracks individual parts of S3 multipart uploads. (RLS: true)

---

## Schema: `pgsodium`

Schema for the `pgsodium` extension (transparent column encryption).

-   `key`: Holds metadata for derived cryptographic keys. (RLS: false)

---

## Schema: `vault`

Schema for the `supabase-vault` extension (encrypted secrets).

-   `secrets`: Table with an encrypted `secret` column. (RLS: false)

---

## Schema: `realtime`

Standard Supabase Realtime schema for WebSocket subscriptions.

-   `schema_migrations`: Manages updates to the Realtime schema. (RLS: false)
-   `subscription`: Tracks active client subscriptions. (RLS: false)
-   `messages`: Internal table potentially used for broadcast/presence messages (usage may vary). (RLS: true)

---

## Schema: `drizzle`

Schema used by Drizzle ORM for tracking its migrations.

-   `__drizzle_migrations`: Tracks schema migrations applied by Drizzle Kit. (RLS: false)

---

## Database Functions

### Schema: `public`

#### Function: `handle_document_tagging()`

-   **Purpose**: Trigger function to automatically add an 'artifact' tag to the `tags` array of a `Document` row if it's not already present.
-   **Returns**: `trigger`
-   **Definition**:
    ```sql
    CREATE OR REPLACE FUNCTION public.handle_document_tagging()
     RETURNS trigger
     LANGUAGE plpgsql
    AS $function$
    declare
      tag text := $tag$artifact$tag$;
    begin
      -- Initialize tags array if null
      new.tags := coalesce(new.tags, array[]::text[]);

      -- Add artifact tag if not present
      if not tag = any (new.tags) then
        new.tags := array_append(new.tags, tag);
      end if;

      return new;
    end;
    $function$
    ```

#### Function: `update_updated_at_column()`

-   **Purpose**: Generic trigger function to set the `updated_at` column to the current timestamp (`now()`). *Note: No trigger currently calls this function in the `public` schema according to `information_schema.triggers`.*
-   **Returns**: `trigger`
-   **Definition**:
    ```sql
    CREATE OR REPLACE FUNCTION public.update_updated_at_column()
     RETURNS trigger
     LANGUAGE plpgsql
    AS $function$
    BEGIN
      NEW.updated_at = now();
      RETURN NEW;
    END;
    $function$
    ```

#### Function: `update_user_metadata(user_id uuid, metadata jsonb)`

-   **Purpose**: Updates the `raw_user_meta_data` JSONB column in the `auth.users` table for a given `user_id` by merging the existing metadata with the provided `metadata` JSONB object. Defined with `SECURITY DEFINER`.
-   **Returns**: `void`
-   **Definition**:
    ```sql
    CREATE OR REPLACE FUNCTION public.update_user_metadata(user_id uuid, metadata jsonb)
     RETURNS void
     LANGUAGE plpgsql
     SECURITY DEFINER
    AS $function$
    BEGIN
      UPDATE auth.users
      SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || metadata
      WHERE id = user_id;
    END;
    $function$
    ```

## Database Triggers

| Schema | Table    | Name                     | Events         | Timing | Orientation | Action Statement                      |
| :----- | :------- | :----------------------- | :------------- | :----- | :---------- | :------------------------------------ |
| public | Document | `tag_document_on_change` | INSERT, UPDATE | BEFORE | ROW         | `EXECUTE FUNCTION handle_document_tagging()` |

*(Note: Only triggers in the `public` schema are listed. The `handle_new_user` logic is not implemented via a trigger in the `public` schema based on this query.)* 