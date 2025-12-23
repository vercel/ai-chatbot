-- 001_tiqology_optimizations.sql
-- Create requested indexes and enable RLS + policies for TiQology
-- Non-destructive: uses IF NOT EXISTS where supported
-- Idempotent: safe to re-run

BEGIN;

-- =========================
-- INDEXES (19)
-- =========================

-- users (User table has: id, email, password - no timestamp columns)
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON public."User" (email);

-- chats
CREATE INDEX IF NOT EXISTS idx_chats_user_id ON public."Chat" ("userId");
CREATE INDEX IF NOT EXISTS idx_chats_created_at ON public."Chat" ("createdAt");
CREATE INDEX IF NOT EXISTS idx_chats_visibility ON public."Chat" (visibility);
CREATE INDEX IF NOT EXISTS idx_chats_user_created ON public."Chat" ("userId", "createdAt");

-- messages
CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON public."Message_v2" ("chatId");
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public."Message_v2" ("createdAt");
CREATE INDEX IF NOT EXISTS idx_messages_role ON public."Message_v2" (role);
CREATE INDEX IF NOT EXISTS idx_messages_chat_created ON public."Message_v2" ("chatId", "createdAt");

-- documents
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON public."Document" ("userId");
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON public."Document" ("createdAt");
CREATE INDEX IF NOT EXISTS idx_documents_kind ON public."Document" (kind);

-- votes
CREATE INDEX IF NOT EXISTS idx_votes_chat_id ON public."Vote_v2" ("chatId");
CREATE INDEX IF NOT EXISTS idx_votes_message_id ON public."Vote_v2" ("messageId");

-- suggestions
CREATE INDEX IF NOT EXISTS idx_suggestions_document_id ON public."Suggestion" ("documentId");
CREATE INDEX IF NOT EXISTS idx_suggestions_user_id ON public."Suggestion" ("userId");
CREATE INDEX IF NOT EXISTS idx_suggestions_created_at ON public."Suggestion" ("createdAt");

-- =========================
-- ENABLE RLS ON TABLES
-- =========================

ALTER TABLE IF EXISTS public."User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."Chat" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."Message_v2" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."Document" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."Vote_v2" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."Suggestion" ENABLE ROW LEVEL SECURITY;

-- =========================
-- RLS POLICIES (15)
-- Uses (SELECT auth.uid()) casting to uuid for comparison.
-- Idempotent: checks pg_policies before creating
-- =========================

-- USERS
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='User' AND polname='users_select_own'
  ) THEN
    EXECUTE $policy$CREATE POLICY users_select_own ON public."User"
      FOR SELECT TO authenticated
      USING ((SELECT auth.uid())::uuid = id)$policy$;
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='User' AND polname='users_update_own'
  ) THEN
    EXECUTE $policy$CREATE POLICY users_update_own ON public."User"
      FOR UPDATE TO authenticated
      USING ((SELECT auth.uid())::uuid = id)
      WITH CHECK ((SELECT auth.uid())::uuid = id)$policy$;
  END IF;
END$$;

-- CHATS
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='Chat' AND polname='chats_select_own'
  ) THEN
    EXECUTE $policy$CREATE POLICY chats_select_own ON public."Chat"
      FOR SELECT TO authenticated
      USING ("userId" = (SELECT auth.uid())::uuid OR visibility = 'public')$policy$;
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='Chat' AND polname='chats_insert_own'
  ) THEN
    EXECUTE $policy$CREATE POLICY chats_insert_own ON public."Chat"
      FOR INSERT TO authenticated
      WITH CHECK ("userId" = (SELECT auth.uid())::uuid)$policy$;
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='Chat' AND polname='chats_update_own'
  ) THEN
    EXECUTE $policy$CREATE POLICY chats_update_own ON public."Chat"
      FOR UPDATE TO authenticated
      USING ("userId" = (SELECT auth.uid())::uuid)
      WITH CHECK ("userId" = (SELECT auth.uid())::uuid)$policy$;
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='Chat' AND polname='chats_delete_own'
  ) THEN
    EXECUTE $policy$CREATE POLICY chats_delete_own ON public."Chat"
      FOR DELETE TO authenticated
      USING ("userId" = (SELECT auth.uid())::uuid)$policy$;
  END IF;
END$$;

-- MESSAGES
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='Message_v2' AND polname='messages_select_chat_access'
  ) THEN
    EXECUTE $policy$CREATE POLICY messages_select_chat_access ON public."Message_v2"
      FOR SELECT TO authenticated
      USING (EXISTS (
        SELECT 1 FROM public."Chat" c
        WHERE c.id = public."Message_v2"."chatId"
        AND (c."userId" = (SELECT auth.uid())::uuid OR c.visibility = 'public')
      ))$policy$;
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='Message_v2' AND polname='messages_insert_chat_owner'
  ) THEN
    EXECUTE $policy$CREATE POLICY messages_insert_chat_owner ON public."Message_v2"
      FOR INSERT TO authenticated
      WITH CHECK (EXISTS (
        SELECT 1 FROM public."Chat" c
        WHERE c.id = "chatId"
        AND c."userId" = (SELECT auth.uid())::uuid
      ))$policy$;
  END IF;
END$$;

-- DOCUMENTS
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='Document' AND polname='documents_select_own'
  ) THEN
    EXECUTE $policy$CREATE POLICY documents_select_own ON public."Document"
      FOR SELECT TO authenticated
      USING ("userId" = (SELECT auth.uid())::uuid)$policy$;
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='Document' AND polname='documents_insert_own'
  ) THEN
    EXECUTE $policy$CREATE POLICY documents_insert_own ON public."Document"
      FOR INSERT TO authenticated
      WITH CHECK ("userId" = (SELECT auth.uid())::uuid)$policy$;
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='Document' AND polname='documents_update_own'
  ) THEN
    EXECUTE $policy$CREATE POLICY documents_update_own ON public."Document"
      FOR UPDATE TO authenticated
      USING ("userId" = (SELECT auth.uid())::uuid)
      WITH CHECK ("userId" = (SELECT auth.uid())::uuid)$policy$;
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='Document' AND polname='documents_delete_own'
  ) THEN
    EXECUTE $policy$CREATE POLICY documents_delete_own ON public."Document"
      FOR DELETE TO authenticated
      USING ("userId" = (SELECT auth.uid())::uuid)$policy$;
  END IF;
END$$;

-- VOTES
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='Vote_v2' AND polname='votes_select_all'
  ) THEN
    EXECUTE $policy$CREATE POLICY votes_select_all ON public."Vote_v2"
      FOR SELECT TO authenticated
      USING (true)$policy$;
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='Vote_v2' AND polname='votes_insert_chat_access'
  ) THEN
    EXECUTE $policy$CREATE POLICY votes_insert_chat_access ON public."Vote_v2"
      FOR INSERT TO authenticated
      WITH CHECK (EXISTS (
        SELECT 1 FROM public."Chat" c
        WHERE c.id = "chatId"
        AND c."userId" = (SELECT auth.uid())::uuid
      ))$policy$;
  END IF;
END$$;

-- SUGGESTIONS
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='Suggestion' AND polname='suggestions_select_document_access'
  ) THEN
    EXECUTE $policy$CREATE POLICY suggestions_select_document_access ON public."Suggestion"
      FOR SELECT TO authenticated
      USING (EXISTS (
        SELECT 1 FROM public."Document" d
        WHERE d.id = public."Suggestion"."documentId"
        AND d."userId" = (SELECT auth.uid())::uuid
      ))$policy$;
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='Suggestion' AND polname='suggestions_insert_document_access'
  ) THEN
    EXECUTE $policy$CREATE POLICY suggestions_insert_document_access ON public."Suggestion"
      FOR INSERT TO authenticated
      WITH CHECK (EXISTS (
        SELECT 1 FROM public."Document" d
        WHERE d.id = "documentId"
        AND d."userId" = (SELECT auth.uid())::uuid
      ))$policy$;
  END IF;
END$$;

COMMIT;
