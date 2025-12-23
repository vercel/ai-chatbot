-- 002_verify_optimizations.sql
-- Returns rows confirming indexes exist, RLS is enabled, and policies are present.

-- =========================
-- 1) INDEX COUNT (expect 19)
-- =========================

SELECT
  count(*) AS found_indexes
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname IN (
    'idx_users_email','idx_users_created_at','idx_users_updated_at',
    'idx_chats_user_id','idx_chats_created_at','idx_chats_visibility','idx_chats_user_created',
    'idx_messages_chat_id','idx_messages_created_at','idx_messages_role','idx_messages_chat_created',
    'idx_documents_user_id','idx_documents_created_at','idx_documents_kind',
    'idx_votes_chat_id','idx_votes_message_id',
    'idx_suggestions_document_id','idx_suggestions_user_id','idx_suggestions_created_at'
  );

-- =========================
-- 2) WHICH INDEXES EXIST
-- =========================

SELECT indexname 
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname IN (
    'idx_users_email','idx_users_created_at','idx_users_updated_at',
    'idx_chats_user_id','idx_chats_created_at','idx_chats_visibility','idx_chats_user_created',
    'idx_messages_chat_id','idx_messages_created_at','idx_messages_role','idx_messages_chat_created',
    'idx_documents_user_id','idx_documents_created_at','idx_documents_kind',
    'idx_votes_chat_id','idx_votes_message_id',
    'idx_suggestions_document_id','idx_suggestions_user_id','idx_suggestions_created_at'
  )
ORDER BY indexname;

-- =========================
-- 3) RLS ENABLED? (expect 6 tables with true)
-- =========================

SELECT relname AS table_name, relrowsecurity AS rls_enabled
FROM pg_class
WHERE relname IN ('users','chats','messages','documents','votes','suggestions');

-- =========================
-- 4) POLICY COUNT BY TABLE
-- =========================

SELECT tablename, count(*) AS policy_count
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('users','chats','messages','documents','votes','suggestions')
GROUP BY tablename
ORDER BY tablename;

-- Expected: users:2, chats:4, messages:2, documents:4, votes:2, suggestions:2

-- =========================
-- 5) LIST ALL POLICY NAMES
-- =========================

SELECT tablename, polname
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('users','chats','messages','documents','votes','suggestions')
ORDER BY tablename, polname;
