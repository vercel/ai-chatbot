-- 004_rollback_optimizations.sql
-- ROLLBACK migration for TiQology optimizations
-- ⚠️  WARNING: This drops indexes and policies. Use only if you need to revert changes.

BEGIN;

-- =========================
-- DROP POLICIES (15)
-- =========================

-- USERS
DROP POLICY IF EXISTS users_select_own ON public.users;
DROP POLICY IF EXISTS users_update_own ON public.users;

-- CHATS
DROP POLICY IF EXISTS chats_select_own ON public.chats;
DROP POLICY IF EXISTS chats_insert_own ON public.chats;
DROP POLICY IF EXISTS chats_update_own ON public.chats;
DROP POLICY IF EXISTS chats_delete_own ON public.chats;

-- MESSAGES
DROP POLICY IF EXISTS messages_select_chat_access ON public.messages;
DROP POLICY IF EXISTS messages_insert_chat_owner ON public.messages;

-- DOCUMENTS
DROP POLICY IF EXISTS documents_select_own ON public.documents;
DROP POLICY IF EXISTS documents_insert_own ON public.documents;
DROP POLICY IF EXISTS documents_update_own ON public.documents;
DROP POLICY IF EXISTS documents_delete_own ON public.documents;

-- VOTES
DROP POLICY IF EXISTS votes_select_all ON public.votes;
DROP POLICY IF EXISTS votes_insert_chat_access ON public.votes;

-- SUGGESTIONS
DROP POLICY IF EXISTS suggestions_select_document_access ON public.suggestions;
DROP POLICY IF EXISTS suggestions_insert_document_access ON public.suggestions;

-- =========================
-- DISABLE RLS (optional - be careful!)
-- Uncomment if you want to fully disable RLS
-- =========================

-- ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.chats DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.messages DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.documents DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.votes DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.suggestions DISABLE ROW LEVEL SECURITY;

-- =========================
-- DROP INDEXES (19)
-- =========================

-- users
DROP INDEX IF EXISTS public.idx_users_email;
DROP INDEX IF EXISTS public.idx_users_created_at;
DROP INDEX IF EXISTS public.idx_users_updated_at;

-- chats
DROP INDEX IF EXISTS public.idx_chats_user_id;
DROP INDEX IF EXISTS public.idx_chats_created_at;
DROP INDEX IF EXISTS public.idx_chats_visibility;
DROP INDEX IF EXISTS public.idx_chats_user_created;

-- messages
DROP INDEX IF EXISTS public.idx_messages_chat_id;
DROP INDEX IF EXISTS public.idx_messages_created_at;
DROP INDEX IF EXISTS public.idx_messages_role;
DROP INDEX IF EXISTS public.idx_messages_chat_created;

-- documents
DROP INDEX IF EXISTS public.idx_documents_user_id;
DROP INDEX IF EXISTS public.idx_documents_created_at;
DROP INDEX IF EXISTS public.idx_documents_kind;

-- votes
DROP INDEX IF EXISTS public.idx_votes_chat_id;
DROP INDEX IF EXISTS public.idx_votes_message_id;

-- suggestions
DROP INDEX IF EXISTS public.idx_suggestions_document_id;
DROP INDEX IF EXISTS public.idx_suggestions_user_id;
DROP INDEX IF EXISTS public.idx_suggestions_created_at;

-- =========================
-- RESET AUTOVACUUM SETTINGS
-- =========================

-- Reset database-level settings to defaults
ALTER DATABASE current_database() RESET autovacuum_vacuum_scale_factor;
ALTER DATABASE current_database() RESET autovacuum_vacuum_threshold;
ALTER DATABASE current_database() RESET autovacuum_naptime;
ALTER DATABASE current_database() RESET autovacuum_vacuum_cost_limit;

-- Reset per-table settings
ALTER TABLE IF EXISTS public.messages RESET (
  autovacuum_vacuum_scale_factor,
  autovacuum_vacuum_threshold,
  autovacuum_analyze_scale_factor,
  autovacuum_analyze_threshold
);

ALTER TABLE IF EXISTS public.chats RESET (
  autovacuum_vacuum_scale_factor,
  autovacuum_vacuum_threshold
);

COMMIT;

-- Run VACUUM after rollback to clean up
VACUUM (VERBOSE, ANALYZE) public.messages;
VACUUM (VERBOSE, ANALYZE) public.chats;
VACUUM (VERBOSE, ANALYZE) public.users;
VACUUM (VERBOSE, ANALYZE) public.documents;
VACUUM (VERBOSE, ANALYZE) public.votes;
VACUUM (VERBOSE, ANALYZE) public.suggestions;
