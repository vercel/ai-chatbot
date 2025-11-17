-- Initial database schema (consolidated from Drizzle migrations)
-- Generated on 2025-11-11
-- This migration creates all base tables in their final snake_case form
-- Users table
CREATE TABLE IF NOT EXISTS public.users(
    id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    email varchar(64) NOT NULL,
    password varchar(64),
    onboarding_completed boolean NOT NULL DEFAULT FALSE
);

-- Chats table
CREATE TABLE IF NOT EXISTS public.chats(
    id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp NOT NULL,
    title text NOT NULL,
    user_id uuid NOT NULL,
    visibility varchar NOT NULL DEFAULT 'private',
    last_context jsonb,
    CONSTRAINT chats_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE NO action ON UPDATE NO action
);

-- Messages table (AI SDK 5 format)
CREATE TABLE IF NOT EXISTS public.messages(
    id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    chat_id uuid NOT NULL,
    role varchar NOT NULL,
    parts json NOT NULL,
    attachments json NOT NULL,
    created_at timestamp NOT NULL,
    CONSTRAINT messages_chat_id_chats_id_fk FOREIGN KEY (chat_id) REFERENCES public.chats(id) ON DELETE NO action ON UPDATE NO action
);

-- Votes table
CREATE TABLE IF NOT EXISTS public.votes(
    chat_id uuid NOT NULL,
    message_id uuid NOT NULL,
    is_upvoted boolean NOT NULL,
    CONSTRAINT votes_chat_id_message_id_pk PRIMARY KEY (chat_id, message_id),
    CONSTRAINT votes_chat_id_chats_id_fk FOREIGN KEY (chat_id) REFERENCES public.chats(id) ON DELETE NO action ON UPDATE NO action,
    CONSTRAINT votes_message_id_messages_id_fk FOREIGN KEY (message_id) REFERENCES public.messages(id) ON DELETE NO action ON UPDATE NO action
);

-- Documents table
CREATE TABLE IF NOT EXISTS public.documents(
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    created_at timestamp NOT NULL,
    title text NOT NULL,
    content text,
    kind varchar NOT NULL DEFAULT 'text',
    user_id uuid NOT NULL,
    CONSTRAINT documents_id_created_at_pk PRIMARY KEY (id, created_at),
    CONSTRAINT documents_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE NO action ON UPDATE NO action
);

-- Suggestions table
CREATE TABLE IF NOT EXISTS public.suggestions(
    id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    document_id uuid NOT NULL,
    document_created_at timestamp NOT NULL,
    original_text text NOT NULL,
    suggested_text text NOT NULL,
    description text,
    is_resolved boolean NOT NULL DEFAULT FALSE,
    user_id uuid NOT NULL,
    created_at timestamp NOT NULL,
    CONSTRAINT suggestions_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE NO action ON UPDATE NO action,
    CONSTRAINT suggestions_document_id_document_created_at_documents_id_created_at_fk FOREIGN KEY (document_id, document_created_at) REFERENCES public.documents(id, created_at) ON DELETE NO action ON UPDATE NO action
);

-- Streams table
CREATE TABLE IF NOT EXISTS public.streams(
    id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    chat_id uuid NOT NULL,
    created_at timestamp NOT NULL,
    CONSTRAINT streams_chat_id_chats_id_fk FOREIGN KEY (chat_id) REFERENCES public.chats(id) ON DELETE NO action ON UPDATE NO action
);

-- Create indexes for foreign keys
CREATE INDEX IF NOT EXISTS chats_user_id_idx ON public.chats(user_id);

CREATE INDEX IF NOT EXISTS messages_chat_id_idx ON public.messages(chat_id);

CREATE INDEX IF NOT EXISTS votes_chat_id_idx ON public.votes(chat_id);

CREATE INDEX IF NOT EXISTS votes_message_id_idx ON public.votes(message_id);

CREATE INDEX IF NOT EXISTS documents_user_id_idx ON public.documents(user_id);

CREATE INDEX IF NOT EXISTS suggestions_user_id_idx ON public.suggestions(user_id);

CREATE INDEX IF NOT EXISTS suggestions_document_idx ON public.suggestions(document_id, document_created_at);

CREATE INDEX IF NOT EXISTS streams_chat_id_idx ON public.streams(chat_id);

