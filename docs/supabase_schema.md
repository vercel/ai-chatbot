# Database Schema Documentation

This document outlines the tables found in the Supabase project `dvlcpljodhsfrucieoqd`, grouped by schema.

## Schema: `auth`

Standard Supabase Auth schema.

- `users`: Stores user login data. (RLS enabled)
- `refresh_tokens`: Stores refresh tokens for JWTs. (RLS enabled)
- `instances`: Manages users across multiple sites. (RLS enabled)
- `audit_log_entries`: Audit trail for user actions. (RLS enabled)
- `schema_migrations`: Manages updates to the auth system. (RLS enabled)
- `identities`: Stores identities (e.g., OAuth) associated with users. (RLS enabled)
- `sessions`: Stores session data associated with users. (RLS enabled)
- `mfa_factors`: Stores metadata about MFA factors. (RLS enabled)
- `mfa_challenges`: Stores metadata about MFA challenge requests. (RLS enabled)
- `mfa_amr_claims`: Stores AMR claims for MFA. (RLS enabled)
- `sso_providers`: Manages SSO provider information. (RLS enabled)
- `sso_domains`: Manages SSO domain mapping. (RLS enabled)
- `saml_providers`: Manages SAML IdP connections. (RLS enabled)
- `saml_relay_states`: Contains SAML Relay State information. (RLS enabled)
- `flow_state`: Stores metadata for PKCE logins. (RLS enabled)
- `one_time_tokens`: Stores one-time tokens (e.g., confirmation). (RLS enabled)

## Schema: `storage`

Standard Supabase Storage schema.

- `buckets`: Stores storage bucket information. (RLS enabled)
- `objects`: Stores storage object information. (RLS enabled)
- `migrations`: Manages updates to the storage system. (RLS enabled)
- `s3_multipart_uploads`: Tracks S3 multipart uploads. (RLS enabled)
- `s3_multipart_uploads_parts`: Tracks parts of S3 multipart uploads. (RLS enabled)

## Schema: `pgsodium`

Schema for the `pgsodium` extension (transparent column encryption).

- `key`: Holds metadata for derived cryptographic keys.

## Schema: `vault`

Schema for the `supabase-vault` extension (encrypted secrets).

- `secrets`: Table with encrypted `secret` column for storing sensitive information.

## Schema: `realtime`

Standard Supabase Realtime schema.

- `schema_migrations`: Manages updates to the Realtime system.
- `subscription`: Tracks Realtime subscriptions.
- `messages`: Internal table for Realtime broadcast/presence messages. (RLS enabled)

## Schema: `drizzle`

Schema used by Drizzle ORM for tracking migrations.

- `__drizzle_migrations`: Tracks schema migrations applied by Drizzle ORM.

## Schema: `public`

Custom application tables.

### Table: `Suggestion`

- **Comment**: null
- **RLS Enabled**: true
- **Live Rows Estimate**: 0 (Note: Table appears empty, potentially deprecated)
- **Primary Key(s)**: `id` (uuid)
- **Foreign Keys**:
    - `(documentId, documentCreatedAt)` -> `public.Document(id, createdAt)` (Constraint: `Suggestion_documentId_documentCreatedAt_Document_id_createdAt_f`)
    - `(userId)` -> `auth.users(id)` (Constraint: `suggestion_user_id_fkey`)
- **Columns**:
    - `id` (uuid, default: `gen_random_uuid()`)
    - `documentId` (uuid)
    - `documentCreatedAt` (timestamp)
    - `originalText` (text)
    - `suggestedText` (text)
    - `description` (text, nullable)
    - `isResolved` (boolean, default: `false`)
    - `userId` (uuid)
    - `createdAt` (timestamp)

### Table: `Document`

- **Comment**: null
- **RLS Enabled**: true
- **Live Rows Estimate**: 3
- **Primary Key(s)**: `id` (uuid), `createdAt` (timestamp)
- **Foreign Keys**:
    - `(chat_id)` -> `public.Chat(id)` (Constraint: `fk_document_chat`)
    - `(userId)` -> `auth.users(id)` (Constraint: `document_user_id_fkey`)
- **Incoming Foreign Keys**:
    - `public.Suggestion(documentId, documentCreatedAt)` -> `(id, createdAt)` (Constraint: `Suggestion_documentId_documentCreatedAt_Document_id_createdAt_f`)
- **Columns**:
    - `id` (uuid, default: `gen_random_uuid()`)
    - `createdAt` (timestamp)
    - `title` (text)
    - `content` (text, nullable)
    - `userId` (uuid)
    - `kind` (varchar, default: `'text'::character varying`)
    - `tags` (ARRAY, _text, nullable, default: `ARRAY[]::text[]`)
    - `modifiedAt` (timestamptz, nullable, default: `now()`)
    - `chat_id` (uuid, nullable)

### Table: `User_Profiles`

- **Comment**: null
- **RLS Enabled**: true
- **Live Rows Estimate**: 1
- **Primary Key(s)**: `id` (uuid)
- **Foreign Keys**:
    - `(auth.refresh_tokens)` -> `auth.refresh_tokens(token)` (Constraint: `User_Profiles_auth.refresh_tokens_fkey`)
    - `(id)` -> `auth.users(id)` (Constraint: `User_Profiles_id_fkey`)
- **Columns**:
    - `id` (uuid, default: `gen_random_uuid()`)
    - `created_at` (timestamptz, default: `now()`)
    - `modified_at` (timestamptz, nullable, default: `now()`)
    - `google_refresh_token` (text, nullable)
    - `auth.refresh_tokens` (text, nullable)
    - `email` (varchar, nullable)

### Table: `User`

- **Comment**: null
- **RLS Enabled**: false
- **Live Rows Estimate**: 2
- **Primary Key(s)**: `id` (uuid)
- **Incoming Foreign Keys**:
    - `public.Chat(userId)` -> `(id)` (Constraint: `Chat_userId_fkey`)
- **Columns**:
    - `id` (uuid)
    - `email` (varchar)

### Table: `Chat`

- **Comment**: null
- **RLS Enabled**: false
- **Live Rows Estimate**: 36
- **Primary Key(s)**: `id` (uuid)
- **Foreign Keys**:
    - `(userId)` -> `public.User(id)` (Constraint: `Chat_userId_fkey`)
- **Incoming Foreign Keys**:
    - `public.Document(chat_id)` -> `(id)` (Constraint: `fk_document_chat`)
    - `public.Message(chatId)` -> `(id)` (Constraint: `Message_chatId_fkey`)
    - `public.Message_v2(chatId)` -> `(id)` (Constraint: `Message_v2_chatId_fkey`)
    - `public.Vote(chatId)` -> `(id)` (Constraint: `Vote_chatId_fkey`)
    - `public.Vote_v2(chatId)` -> `(id)` (Constraint: `Vote_v2_chatId_fkey`)
- **Columns**:
    - `id` (uuid, default: `gen_random_uuid()`)
    - `createdAt` (timestamp)
    - `title` (text)
    - `userId` (uuid)
    - `visibility` (varchar, default: `'private'::character varying`, check: `visibility::text = ANY (ARRAY['public'::character varying, 'private'::character varying]::text[])`)

### Table: `Message_v2`

- **Comment**: null
- **RLS Enabled**: false
- **Live Rows Estimate**: 94
- **Primary Key(s)**: `id` (uuid)
- **Foreign Keys**:
    - `(chatId)` -> `public.Chat(id)` (Constraint: `Message_v2_chatId_fkey`)
- **Incoming Foreign Keys**:
    - `public.Vote_v2(messageId)` -> `(id)` (Constraint: `Vote_v2_messageId_fkey`)
- **Columns**:
    - `id` (uuid, default: `gen_random_uuid()`)
    - `chatId` (uuid)
    - `role` (varchar)
    - `parts` (json)
    - `attachments` (json)
    - `createdAt` (timestamp)

### Table: `Vote_v2`

- **Comment**: null
- **RLS Enabled**: false
- **Live Rows Estimate**: 1
- **Primary Key(s)**: `chatId` (uuid), `messageId` (uuid)
- **Foreign Keys**:
    - `(chatId)` -> `public.Chat(id)` (Constraint: `Vote_v2_chatId_fkey`)
    - `(messageId)` -> `public.Message_v2(id)` (Constraint: `Vote_v2_messageId_fkey`)
- **Columns**:
    - `chatId` (uuid)
    - `messageId` (uuid)
    - `isUpvoted` (boolean)

### Table: `Message`

- **Comment**: null
- **RLS Enabled**: false
- **Live Rows Estimate**: 0 (Note: Table appears empty, potentially deprecated)
- **Primary Key(s)**: `id` (uuid)
- **Foreign Keys**:
    - `(chatId)` -> `public.Chat(id)` (Constraint: `Message_chatId_fkey`)
- **Incoming Foreign Keys**:
    - `public.Vote(messageId)` -> `(id)` (Constraint: `Vote_messageId_fkey`)
- **Columns**:
    - `id` (uuid, default: `gen_random_uuid()`)
    - `chatId` (uuid)
    - `role` (varchar)
    - `content` (json)
    - `createdAt` (timestamp)

### Table: `Vote`

- **Comment**: null
- **RLS Enabled**: false
- **Live Rows Estimate**: 0 (Note: Table appears empty, potentially deprecated)
- **Primary Key(s)**: `chatId` (uuid), `messageId` (uuid)
- **Foreign Keys**:
    - `(chatId)` -> `public.Chat(id)` (Constraint: `Vote_chatId_fkey`)
    - `(messageId)` -> `public.Message(id)` (Constraint: `Vote_messageId_fkey`)
- **Columns**:
    - `chatId` (uuid)
    - `messageId` (uuid)
    - `isUpvoted` (boolean)

### Table: `user_provider_tokens`

- **Comment**: null
- **RLS Enabled**: true
- **Live Rows Estimate**: 2
- **Primary Key(s)**: `id` (uuid)
- **Foreign Keys**:
    - `(user_id)` -> `auth.users(id)` (Constraint: `user_provider_tokens_user_id_fkey`)
- **Columns**:
    - `id` (uuid, default: `gen_random_uuid()`)
    - `user_id` (uuid)
    - `provider` (text)
    - `access_token` (text)
    - `refresh_token` (text, nullable)
    - `created_at` (timestamptz, default: `now()`)
    - `updated_at` (timestamptz, default: `now()`)
    - `email` (varchar, nullable)

### Table: `chats`

- **Comment**: null
- **RLS Enabled**: false
- **Live Rows Estimate**: 0 (Note: Table appears empty, potentially deprecated)
- **Primary Key(s)**: `id` (uuid)
- **Foreign Keys**:
    - `(user_id)` -> `auth.users(id)` (Constraint: `chats_user_id_fkey`)
- **Incoming Foreign Keys**:
    - `public.messages(chat_id)` -> `(id)` (Constraint: `messages_chat_id_fkey`)
    - `public.votes(chat_id)` -> `(id)` (Constraint: `votes_chat_id_fkey`)
- **Columns**:
    - `id` (uuid, default: `gen_random_uuid()`)
    - `user_id` (uuid)
    - `title` (text)
    - `visibility` (text, check: `visibility = ANY (ARRAY['public'::text, 'private'::text])`)
    - `created_at` (timestamptz, default: `now()`)
    - `updated_at` (timestamptz, default: `now()`)

### Table: `messages`

- **Comment**: null
- **RLS Enabled**: false
- **Live Rows Estimate**: 0 (Note: Table appears empty, potentially deprecated)
- **Primary Key(s)**: `id` (uuid)
- **Foreign Keys**:
    - `(chat_id)` -> `public.chats(id)` (Constraint: `messages_chat_id_fkey`)
- **Incoming Foreign Keys**:
    - `public.votes(message_id)` -> `(id)` (Constraint: `votes_message_id_fkey`)
- **Columns**:
    - `id` (uuid, default: `gen_random_uuid()`)
    - `chat_id` (uuid)
    - `role` (text, check: `role = ANY (ARRAY['user'::text, 'assistant'::text, 'system'::text])`)
    - `content` (text)
    - `parts` (jsonb, nullable)
    - `attachments` (jsonb, nullable)
    - `created_at` (timestamptz, default: `now()`)
    - `updated_at` (timestamptz, default: `now()`)

### Table: `votes`

- **Comment**: null
- **RLS Enabled**: false
- **Live Rows Estimate**: 0 (Note: Table appears empty, potentially deprecated)
- **Primary Key(s)**: `chat_id` (uuid), `message_id` (uuid), `user_id` (uuid)
- **Foreign Keys**:
    - `(chat_id)` -> `public.chats(id)` (Constraint: `votes_chat_id_fkey`)
    - `(message_id)` -> `public.messages(id)` (Constraint: `votes_message_id_fkey`)
    - `(user_id)` -> `auth.users(id)` (Constraint: `votes_user_id_fkey`)
- **Columns**:
    - `chat_id` (uuid)
    - `message_id` (uuid)
    - `user_id` (uuid)
    - `is_upvoted` (boolean)
    - `created_at` (timestamptz, default: `now()`)
    - `updated_at` (timestamptz, default: `now()`)

### Table: `webhook_logs`

- **Comment**: null
- **RLS Enabled**: false
- **Live Rows Estimate**: 1
- **Primary Key(s)**: `id` (uuid)
- **Columns**:
    - `id` (uuid, default: `gen_random_uuid()`)
    - `user_id` (uuid)
    - `attempted_at` (timestamptz, nullable, default: `now()`)
    - `success` (boolean, nullable)
    - `request_data` (jsonb, nullable)
    - `response_data` (text, nullable)
    - `error_message` (text, nullable)

### Table: `callback_debug_logs`

- **Comment**: null
- **RLS Enabled**: false
- **Live Rows Estimate**: 0 (Note: Table appears empty, potentially deprecated)
- **Primary Key(s)**: `id` (integer)
- **Columns**:
    - `id` (integer, default: `nextval('callback_debug_logs_id_seq'::regclass)`)
    - `timestamp` (timestamptz, nullable, default: `now()`)
    - `user_id` (uuid, nullable)
    - `email` (text, nullable)
    - `provider_token_present` (boolean, nullable)
    - `provider_refresh_token_present` (boolean, nullable)
    - `exchange_error_message` (text, nullable)
    - `save_token_error_message` (text, nullable)
    - `webhook_error_message` (text, nullable)
    - `notes` (text, nullable)

## Schema: `supabase_migrations`

Schema used by Supabase Studio/CLI for tracking migrations.

- `schema_migrations`: Tracks schema migrations applied through Supabase Studio/CLI.

## Schema: `net`

Schema for the `pg_net` extension (HTTP requests from Postgres).

- `http_request_queue`: Internal queue for `pg_net`.
- `_http_response`: Internal table for `pg_net` responses.

## Database Functions

### Schema: `public`

#### Function: `handle_document_tagging()`

- **Purpose**: Trigger function to automatically add an 'artifact' tag to the `tags` array of a `Document` row if it's not already present.
- **Returns**: `trigger`
- **Code**:
  ```sql
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
  ```

#### Function: `handle_new_user()`

- **Purpose**: Trigger function called when a new user is created in `auth.users`. It inserts a corresponding record into `public.User_Profiles`, copying the `id` and `email`. Includes basic error handling for unique violations or other insertion errors.
- **Returns**: `trigger`
- **Code**:
  ```sql
  BEGIN
    -- Only insert into User_Profiles, including email. All other logic removed.
    BEGIN
        INSERT INTO public."User_Profiles" (id, email)
        VALUES (NEW.id, NEW.email);
        RAISE NOTICE 'Simple Trigger: Inserted new user profile for % with email %', NEW.id, NEW.email;
    EXCEPTION 
        WHEN unique_violation THEN
            RAISE NOTICE 'Simple Trigger: User profile for % already exists.', NEW.id;
        WHEN OTHERS THEN
            -- Log error but do not re-raise to ensure user creation is not blocked by profile insert issue
            RAISE WARNING 'Simple Trigger: Error inserting into User_Profiles for user %: %', NEW.id, SQLERRM;
    END;
    
    RETURN NEW;
  END;
  ```

#### Function: `update_updated_at_column()`

- **Purpose**: Generic trigger function to set the `updated_at` column to the current timestamp (`now()`).
- **Returns**: `trigger`
- **Code**:
  ```sql
  BEGIN
    NEW.updated_at = now();
    RETURN NEW;
  END;
  ```

#### Function: `update_user_metadata(user_id uuid, metadata jsonb)`

- **Purpose**: Updates the `raw_user_meta_data` JSONB column in the `auth.users` table for a given `user_id` by merging the existing metadata with the provided `metadata` JSONB object.
- **Returns**: `void`
- **Code**:
  ```sql
  BEGIN
    UPDATE auth.users
    SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || metadata
    WHERE id = user_id;
  END;
  ```

## Database Triggers

| Name                  | Table       | Function             | Events   | Orientation | Timing | Enabled | Notes                               |
|-----------------------|-------------|----------------------|----------|-------------|--------|---------|-------------------------------------|
| `on_auth_user_created` | `auth.users` | `handle_new_user`    | `INSERT` | `ROW`       | `AFTER`  | Yes     | Creates corresponding profile row |
| *Unnamed?*            | *Various?*  | `update_updated_at_column` | `UPDATE` | `ROW`       | `BEFORE` | Yes?    | Auto-updates `updated_at` column  | 
| *Unnamed?*            | `Document`? | `handle_document_tagging` | `INSERT`, `UPDATE`? | `ROW`? | `BEFORE`? | Yes? | Auto-adds 'artifact' tag | 

*Note: Trigger details for `update_updated_at_column` and `handle_document_tagging` are inferred and may need verification from migration files.* 