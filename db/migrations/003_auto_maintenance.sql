-- 003_auto_maintenance.sql
-- Tune autovacuum/analyze thresholds at database and table level, then run VACUUM ANALYZE.

BEGIN;

-- =========================
-- DATABASE-LEVEL SETTINGS
-- =========================

-- Adjust database-level autovacuum settings for current database
ALTER DATABASE current_database()
  SET autovacuum_vacuum_scale_factor = 0.02;     -- 2% of table rows
ALTER DATABASE current_database()
  SET autovacuum_vacuum_threshold = 50;          -- minimum tuple threshold
ALTER DATABASE current_database()
  SET autovacuum_naptime = '30s';                -- check frequency
ALTER DATABASE current_database()
  SET autovacuum_vacuum_cost_limit = 2000;

-- =========================
-- PER-TABLE TUNING
-- =========================

-- Tune large, write-heavy tables for more aggressive maintenance
ALTER TABLE IF EXISTS public.messages
  SET (
    autovacuum_vacuum_scale_factor = 0.01,
    autovacuum_vacuum_threshold = 100,
    autovacuum_analyze_scale_factor = 0.01,
    autovacuum_analyze_threshold = 100
  );

ALTER TABLE IF EXISTS public.chats
  SET (
    autovacuum_vacuum_scale_factor = 0.01,
    autovacuum_vacuum_threshold = 100
  );

-- =========================
-- IMMEDIATE MAINTENANCE
-- =========================

-- Run immediate maintenance
VACUUM (VERBOSE, ANALYZE) public.messages;
VACUUM (VERBOSE, ANALYZE) public.chats;
VACUUM (VERBOSE, ANALYZE) public.users;
VACUUM (VERBOSE, ANALYZE) public.documents;
VACUUM (VERBOSE, ANALYZE) public.votes;
VACUUM (VERBOSE, ANALYZE) public.suggestions;

COMMIT;
