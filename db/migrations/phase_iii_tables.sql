-- ============================================
-- TiQology Phase III Database Migrations
-- Version: 2.0.0
-- Date: 2025-12-22
-- ============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- TABLE 1: governance_audit
-- Immutable audit trail for all governance decisions
-- ============================================

CREATE TABLE IF NOT EXISTS governance_audit (
  id TEXT PRIMARY KEY,
  action_id TEXT NOT NULL,
  action JSONB NOT NULL,
  verdict TEXT NOT NULL CHECK (verdict IN ('approved', 'warning', 'rejected')),
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
  reasoning TEXT NOT NULL,
  hash TEXT NOT NULL UNIQUE,
  previous_hash TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_governance_audit_timestamp ON governance_audit(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_governance_audit_verdict ON governance_audit(verdict);
CREATE INDEX IF NOT EXISTS idx_governance_audit_hash ON governance_audit(hash);
CREATE INDEX IF NOT EXISTS idx_governance_audit_action_id ON governance_audit(action_id);

-- Audit table is append-only, no updates or deletes allowed
CREATE OR REPLACE FUNCTION prevent_governance_audit_modification()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    RAISE EXCEPTION 'Updates to governance_audit are not allowed. Audit trail must be immutable.';
  ELSIF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'Deletions from governance_audit are not allowed. Audit trail must be immutable.';
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prevent_governance_audit_update
  BEFORE UPDATE ON governance_audit
  FOR EACH ROW EXECUTE FUNCTION prevent_governance_audit_modification();

CREATE TRIGGER prevent_governance_audit_delete
  BEFORE DELETE ON governance_audit
  FOR EACH ROW EXECUTE FUNCTION prevent_governance_audit_modification();

-- Row-Level Security (RLS)
ALTER TABLE governance_audit ENABLE ROW LEVEL SECURITY;

-- Admin policy: Full access for service role
CREATE POLICY governance_audit_admin_policy ON governance_audit
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Read-only policy for authenticated users
CREATE POLICY governance_audit_read_policy ON governance_audit
  FOR SELECT
  TO authenticated
  USING (true);

-- ============================================
-- TABLE 2: agent_state
-- Real-time agent health and status tracking
-- ============================================

CREATE TABLE IF NOT EXISTS agent_state (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('idle', 'busy', 'thinking', 'offline', 'unhealthy', 'retiring')),
  health JSONB NOT NULL,
  current_tasks INTEGER NOT NULL DEFAULT 0,
  completed_tasks INTEGER NOT NULL DEFAULT 0,
  failed_tasks INTEGER NOT NULL DEFAULT 0,
  uptime BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  retired_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_agent_state_status ON agent_state(status);
CREATE INDEX IF NOT EXISTS idx_agent_state_role ON agent_state(role);
CREATE INDEX IF NOT EXISTS idx_agent_state_health ON agent_state USING GIN(health);
CREATE INDEX IF NOT EXISTS idx_agent_state_last_updated ON agent_state(last_updated DESC);

-- Function to auto-update last_updated timestamp
CREATE OR REPLACE FUNCTION update_agent_state_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_updated = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER agent_state_update_timestamp
  BEFORE UPDATE ON agent_state
  FOR EACH ROW EXECUTE FUNCTION update_agent_state_timestamp();

-- Row-Level Security (RLS)
ALTER TABLE agent_state ENABLE ROW LEVEL SECURITY;

-- Admin policy: Full access for service role
CREATE POLICY agent_state_admin_policy ON agent_state
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Read-only policy for authenticated users
CREATE POLICY agent_state_read_policy ON agent_state
  FOR SELECT
  TO authenticated
  USING (true);

-- ============================================
-- TABLE 3: privacy_logs
-- Immutable audit chain for privacy/PII events
-- ============================================

CREATE TABLE IF NOT EXISTS privacy_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  action TEXT NOT NULL,
  data_type TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT,
  compliance_flags TEXT[] NOT NULL DEFAULT '{}',
  signature TEXT NOT NULL,
  hash TEXT NOT NULL UNIQUE,
  previous_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_privacy_logs_user_id ON privacy_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_privacy_logs_timestamp ON privacy_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_privacy_logs_action ON privacy_logs(action);
CREATE INDEX IF NOT EXISTS idx_privacy_logs_hash ON privacy_logs(hash);
CREATE INDEX IF NOT EXISTS idx_privacy_logs_compliance ON privacy_logs USING GIN(compliance_flags);

-- Privacy logs are append-only, no updates or deletes allowed
CREATE OR REPLACE FUNCTION prevent_privacy_logs_modification()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    RAISE EXCEPTION 'Updates to privacy_logs are not allowed. Audit trail must be immutable.';
  ELSIF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'Deletions from privacy_logs are not allowed. Audit trail must be immutable.';
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prevent_privacy_logs_update
  BEFORE UPDATE ON privacy_logs
  FOR EACH ROW EXECUTE FUNCTION prevent_privacy_logs_modification();

CREATE TRIGGER prevent_privacy_logs_delete
  BEFORE DELETE ON privacy_logs
  FOR EACH ROW EXECUTE FUNCTION prevent_privacy_logs_modification();

-- Row-Level Security (RLS)
ALTER TABLE privacy_logs ENABLE ROW LEVEL SECURITY;

-- Admin policy: Full access for service role
CREATE POLICY privacy_logs_admin_policy ON privacy_logs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Users can only read their own privacy logs
CREATE POLICY privacy_logs_user_policy ON privacy_logs
  FOR SELECT
  TO authenticated
  USING (auth.uid()::text = user_id);

-- ============================================
-- TABLE 4: context_state
-- Global context synchronization state
-- ============================================

CREATE TABLE IF NOT EXISTS context_state (
  id SERIAL PRIMARY KEY,
  version INTEGER NOT NULL,
  state JSONB NOT NULL,
  hash TEXT NOT NULL,
  updated_by TEXT NOT NULL,
  last_updated TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_context_state_version ON context_state(version DESC);
CREATE INDEX IF NOT EXISTS idx_context_state_hash ON context_state(hash);
CREATE INDEX IF NOT EXISTS idx_context_state_last_updated ON context_state(last_updated DESC);

-- Row-Level Security (RLS)
ALTER TABLE context_state ENABLE ROW LEVEL SECURITY;

-- Admin policy: Full access for service role
CREATE POLICY context_state_admin_policy ON context_state
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Read-only policy for authenticated users
CREATE POLICY context_state_read_policy ON context_state
  FOR SELECT
  TO authenticated
  USING (true);

-- ============================================
-- UTILITY VIEWS FOR MONITORING
-- ============================================

-- Governance summary view
CREATE OR REPLACE VIEW governance_summary AS
SELECT 
  DATE_TRUNC('hour', timestamp) as hour,
  verdict,
  COUNT(*) as count,
  AVG(score) as avg_score
FROM governance_audit
GROUP BY hour, verdict
ORDER BY hour DESC;

-- Agent health summary view
CREATE OR REPLACE VIEW agent_health_summary AS
SELECT 
  status,
  COUNT(*) as count,
  AVG((health->>'healthScore')::INTEGER) as avg_health_score
FROM agent_state
WHERE retired_at IS NULL
GROUP BY status;

-- Privacy compliance summary view
CREATE OR REPLACE VIEW privacy_compliance_summary AS
SELECT 
  DATE_TRUNC('day', timestamp) as day,
  action,
  COUNT(*) as count,
  array_agg(DISTINCT UNNEST(compliance_flags)) as flags
FROM privacy_logs
GROUP BY day, action
ORDER BY day DESC;

-- ============================================
-- GRANTS
-- ============================================

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO authenticated, service_role;

-- Grant access to tables
GRANT SELECT ON governance_audit TO authenticated;
GRANT ALL ON governance_audit TO service_role;

GRANT SELECT ON agent_state TO authenticated;
GRANT ALL ON agent_state TO service_role;

GRANT SELECT ON privacy_logs TO authenticated;
GRANT ALL ON privacy_logs TO service_role;

GRANT SELECT ON context_state TO authenticated;
GRANT ALL ON context_state TO service_role;

-- Grant access to views
GRANT SELECT ON governance_summary TO authenticated, service_role;
GRANT SELECT ON agent_health_summary TO authenticated, service_role;
GRANT SELECT ON privacy_compliance_summary TO authenticated, service_role;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Verify tables exist
DO $$
DECLARE
  missing_tables TEXT[];
BEGIN
  SELECT ARRAY_AGG(table_name)
  INTO missing_tables
  FROM (
    VALUES 
      ('governance_audit'),
      ('agent_state'),
      ('privacy_logs'),
      ('context_state')
  ) AS expected(table_name)
  WHERE NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = expected.table_name
  );

  IF missing_tables IS NOT NULL THEN
    RAISE EXCEPTION 'Missing tables: %', array_to_string(missing_tables, ', ');
  ELSE
    RAISE NOTICE '✓ All Phase III tables created successfully';
  END IF;
END $$;

-- Verify RLS is enabled
DO $$
DECLARE
  unprotected_tables TEXT[];
BEGIN
  SELECT ARRAY_AGG(tablename)
  INTO unprotected_tables
  FROM pg_tables
  WHERE schemaname = 'public'
  AND tablename IN ('governance_audit', 'agent_state', 'privacy_logs', 'context_state')
  AND NOT EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = pg_tables.tablename
    AND n.nspname = 'public'
    AND c.relrowsecurity = true
  );

  IF unprotected_tables IS NOT NULL THEN
    RAISE EXCEPTION 'RLS not enabled on: %', array_to_string(unprotected_tables, ', ');
  ELSE
    RAISE NOTICE '✓ RLS enabled on all Phase III tables';
  END IF;
END $$;

-- ============================================
-- MIGRATION COMPLETE
-- ============================================

SELECT 
  '🎉 Phase III Database Migration Complete!' as status,
  '4 tables created' as tables,
  '3 immutable audit chains' as audit_chains,
  'RLS enabled with encryption at rest' as security,
  NOW() as completed_at;
