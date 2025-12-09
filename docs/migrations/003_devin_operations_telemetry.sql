-- Migration: Add Devin Operations Telemetry Tables
-- Version: 1.0
-- Date: December 7, 2025
-- Description: Track all Devin autonomous operations for AgentOS telemetry

-- ============================================
-- 1. DEVIN OPERATIONS
-- ============================================

CREATE TABLE IF NOT EXISTS devin_operations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Directive Information
  directive_id VARCHAR(100) NOT NULL UNIQUE,
  directive_title VARCHAR(255) NOT NULL,
  directive_priority VARCHAR(50) NOT NULL, -- critical, high, normal, low
  status VARCHAR(50) NOT NULL, -- pending, in-progress, completed, failed, blocked
  
  -- Execution Details
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  execution_time_ms INTEGER,
  steps_total INTEGER,
  steps_completed INTEGER,
  steps_failed INTEGER,
  
  -- Repository Information
  repository VARCHAR(255),
  branch_name VARCHAR(255),
  base_branch VARCHAR(255) DEFAULT 'main',
  commit_sha VARCHAR(255),
  pr_number INTEGER,
  pr_url TEXT,
  
  -- Assignee Information
  created_by VARCHAR(255), -- 'Coach Chat', 'Super Chat', 'Rocket'
  assigned_to VARCHAR(255) DEFAULT 'Devin',
  
  -- Results
  validation_passed BOOLEAN,
  validation_results JSONB,
  error_message TEXT,
  error_stack TEXT,
  blocking_reason TEXT,
  
  -- Files Changed
  files_created TEXT[], -- Array of file paths
  files_modified TEXT[], -- Array of file paths
  files_deleted TEXT[], -- Array of file paths
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_devin_ops_directive_id ON devin_operations(directive_id);
CREATE INDEX idx_devin_ops_status ON devin_operations(status);
CREATE INDEX idx_devin_ops_priority ON devin_operations(directive_priority);
CREATE INDEX idx_devin_ops_repository ON devin_operations(repository);
CREATE INDEX idx_devin_ops_created_at ON devin_operations(created_at DESC);
CREATE INDEX idx_devin_ops_completed_at ON devin_operations(completed_at DESC);

COMMENT ON TABLE devin_operations IS 'Tracks all Devin autonomous operations from directive execution';
COMMENT ON COLUMN devin_operations.execution_time_ms IS 'Total time from start to completion in milliseconds';
COMMENT ON COLUMN devin_operations.validation_passed IS 'Whether all validation criteria passed';

-- ============================================
-- 2. DEVIN OPERATION STEPS
-- ============================================

CREATE TABLE IF NOT EXISTS devin_operation_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operation_id UUID NOT NULL REFERENCES devin_operations(id) ON DELETE CASCADE,
  
  -- Step Information
  step_number INTEGER NOT NULL,
  step_action VARCHAR(255) NOT NULL,
  step_command TEXT,
  
  -- Execution
  status VARCHAR(50) NOT NULL, -- pending, running, completed, failed, skipped
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER,
  
  -- Results
  output TEXT,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_devin_step_operation_id ON devin_operation_steps(operation_id);
CREATE INDEX idx_devin_step_number ON devin_operation_steps(operation_id, step_number);
CREATE INDEX idx_devin_step_status ON devin_operation_steps(status);

COMMENT ON TABLE devin_operation_steps IS 'Individual execution steps for each Devin operation';
COMMENT ON COLUMN devin_operation_steps.retry_count IS 'Number of times this step was retried';

-- ============================================
-- 3. DEVIN LOGS (Detailed Logging)
-- ============================================

CREATE TABLE IF NOT EXISTS devin_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  level VARCHAR(20) NOT NULL CHECK (level IN ('debug', 'info', 'warn', 'error', 'critical')),
  operation_id UUID REFERENCES devin_operations(id),
  directive_id VARCHAR(100),
  agent VARCHAR(100) NOT NULL DEFAULT 'devin-builder',
  message TEXT NOT NULL,
  metadata JSONB,
  error_stack TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_devin_logs_timestamp ON devin_logs(timestamp DESC);
CREATE INDEX idx_devin_logs_level ON devin_logs(level);
CREATE INDEX idx_devin_logs_operation_id ON devin_logs(operation_id);
CREATE INDEX idx_devin_logs_directive_id ON devin_logs(directive_id);
CREATE INDEX idx_devin_logs_agent ON devin_logs(agent);

-- Enable RLS for logs (public read for transparency)
ALTER TABLE devin_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY devin_logs_public_read ON devin_logs FOR SELECT USING (true);

COMMENT ON TABLE devin_logs IS 'Detailed log entries for all Devin operations and events';

-- ============================================
-- 4. DEVIN TELEMETRY (Aggregated Metrics)
-- ============================================

CREATE TABLE IF NOT EXISTS devin_telemetry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Time Period
  period_type VARCHAR(50) NOT NULL, -- hourly, daily, weekly, monthly
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  
  -- Operation Metrics
  total_operations INTEGER DEFAULT 0,
  completed_operations INTEGER DEFAULT 0,
  failed_operations INTEGER DEFAULT 0,
  blocked_operations INTEGER DEFAULT 0,
  
  -- Performance Metrics
  avg_execution_time_ms INTEGER,
  min_execution_time_ms INTEGER,
  max_execution_time_ms INTEGER,
  p95_execution_time_ms INTEGER,
  
  -- Success Metrics
  success_rate DECIMAL(5,2), -- Percentage
  validation_pass_rate DECIMAL(5,2),
  
  -- Repository Breakdown
  operations_by_repo JSONB, -- {"ai-chatbot": 25, "tiqology-spa": 15}
  
  -- Priority Breakdown
  critical_count INTEGER DEFAULT 0,
  high_count INTEGER DEFAULT 0,
  normal_count INTEGER DEFAULT 0,
  low_count INTEGER DEFAULT 0,
  
  -- Error Analysis
  most_common_errors JSONB, -- [{"error": "Build failed", "count": 5}]
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(period_type, period_start)
);

CREATE INDEX idx_devin_telemetry_period ON devin_telemetry(period_type, period_start DESC);
CREATE INDEX idx_devin_telemetry_success_rate ON devin_telemetry(success_rate);

COMMENT ON TABLE devin_telemetry IS 'Aggregated metrics for Devin performance monitoring';
COMMENT ON COLUMN devin_telemetry.success_rate IS 'Percentage of operations completed successfully';

-- ============================================
-- TRIGGERS
-- ============================================

-- Auto-update updated_at timestamp
CREATE TRIGGER update_devin_operations_updated_at
  BEFORE UPDATE ON devin_operations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Auto-calculate execution time on completion
CREATE OR REPLACE FUNCTION calculate_execution_time()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.completed_at IS NOT NULL AND NEW.started_at IS NOT NULL THEN
    NEW.execution_time_ms := EXTRACT(EPOCH FROM (NEW.completed_at - NEW.started_at)) * 1000;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_devin_execution_time
  BEFORE UPDATE ON devin_operations
  FOR EACH ROW
  EXECUTE FUNCTION calculate_execution_time();

CREATE TRIGGER calculate_devin_step_duration
  BEFORE UPDATE ON devin_operation_steps
  FOR EACH ROW
  EXECUTE FUNCTION calculate_execution_time();

-- Auto-update step counts
CREATE OR REPLACE FUNCTION update_step_counts()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE devin_operations
  SET
    steps_completed = (
      SELECT COUNT(*) FROM devin_operation_steps
      WHERE operation_id = NEW.operation_id AND status = 'completed'
    ),
    steps_failed = (
      SELECT COUNT(*) FROM devin_operation_steps
      WHERE operation_id = NEW.operation_id AND status = 'failed'
    )
  WHERE id = NEW.operation_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_devin_step_counts
  AFTER INSERT OR UPDATE ON devin_operation_steps
  FOR EACH ROW
  EXECUTE FUNCTION update_step_counts();

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to get Devin's current workload
CREATE OR REPLACE FUNCTION get_devin_workload()
RETURNS TABLE (
  pending INTEGER,
  in_progress INTEGER,
  total_today INTEGER,
  avg_time_today INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*)::INTEGER FROM devin_operations WHERE status = 'pending'),
    (SELECT COUNT(*)::INTEGER FROM devin_operations WHERE status = 'in-progress'),
    (SELECT COUNT(*)::INTEGER FROM devin_operations WHERE created_at >= CURRENT_DATE),
    (SELECT AVG(execution_time_ms)::INTEGER FROM devin_operations 
     WHERE completed_at >= CURRENT_DATE AND status = 'completed');
END;
$$ LANGUAGE plpgsql;

-- Function to get Devin's success rate
CREATE OR REPLACE FUNCTION get_devin_success_rate(p_days INTEGER DEFAULT 7)
RETURNS TABLE (
  total_operations INTEGER,
  successful_operations INTEGER,
  failed_operations INTEGER,
  success_rate DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::INTEGER as total,
    COUNT(*) FILTER (WHERE status = 'completed')::INTEGER as successful,
    COUNT(*) FILTER (WHERE status = 'failed')::INTEGER as failed,
    ROUND(
      (COUNT(*) FILTER (WHERE status = 'completed')::DECIMAL / NULLIF(COUNT(*), 0)) * 100,
      2
    ) as rate
  FROM devin_operations
  WHERE created_at >= CURRENT_DATE - (p_days || ' days')::INTERVAL;
END;
$$ LANGUAGE plpgsql;

-- Function to aggregate telemetry
CREATE OR REPLACE FUNCTION aggregate_devin_telemetry(
  p_period_type VARCHAR,
  p_period_start TIMESTAMPTZ,
  p_period_end TIMESTAMPTZ
)
RETURNS VOID AS $$
DECLARE
  v_total INTEGER;
  v_completed INTEGER;
  v_failed INTEGER;
  v_blocked INTEGER;
  v_avg_time INTEGER;
  v_success_rate DECIMAL;
BEGIN
  -- Calculate metrics
  SELECT
    COUNT(*),
    COUNT(*) FILTER (WHERE status = 'completed'),
    COUNT(*) FILTER (WHERE status = 'failed'),
    COUNT(*) FILTER (WHERE status = 'blocked')
  INTO v_total, v_completed, v_failed, v_blocked
  FROM devin_operations
  WHERE created_at >= p_period_start AND created_at < p_period_end;
  
  SELECT AVG(execution_time_ms)::INTEGER
  INTO v_avg_time
  FROM devin_operations
  WHERE completed_at >= p_period_start AND completed_at < p_period_end
    AND status = 'completed';
  
  v_success_rate := ROUND((v_completed::DECIMAL / NULLIF(v_total, 0)) * 100, 2);
  
  -- Upsert telemetry record
  INSERT INTO devin_telemetry (
    period_type,
    period_start,
    period_end,
    total_operations,
    completed_operations,
    failed_operations,
    blocked_operations,
    avg_execution_time_ms,
    success_rate
  )
  VALUES (
    p_period_type,
    p_period_start,
    p_period_end,
    v_total,
    v_completed,
    v_failed,
    v_blocked,
    v_avg_time,
    v_success_rate
  )
  ON CONFLICT (period_type, period_start)
  DO UPDATE SET
    total_operations = EXCLUDED.total_operations,
    completed_operations = EXCLUDED.completed_operations,
    failed_operations = EXCLUDED.failed_operations,
    blocked_operations = EXCLUDED.blocked_operations,
    avg_execution_time_ms = EXCLUDED.avg_execution_time_ms,
    success_rate = EXCLUDED.success_rate;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE devin_operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE devin_operation_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE devin_telemetry ENABLE ROW LEVEL SECURITY;

-- Admin and system can view all
CREATE POLICY "Admin can view all devin operations"
  ON devin_operations FOR SELECT
  USING (true); -- Public read for telemetry

CREATE POLICY "System can manage devin operations"
  ON devin_operations FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admin can view all devin steps"
  ON devin_operation_steps FOR SELECT
  USING (true);

CREATE POLICY "System can manage devin steps"
  ON devin_operation_steps FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Everyone can view telemetry"
  ON devin_telemetry FOR SELECT
  USING (true);

CREATE POLICY "System can manage telemetry"
  ON devin_telemetry FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Composite indexes for common queries
CREATE INDEX idx_devin_ops_status_created ON devin_operations(status, created_at DESC);
CREATE INDEX idx_devin_ops_repo_status ON devin_operations(repository, status);
CREATE INDEX idx_devin_ops_priority_status ON devin_operations(directive_priority, status);

-- Full-text search on error messages
CREATE INDEX idx_devin_ops_error_search ON devin_operations USING GIN(to_tsvector('english', error_message));

-- ============================================
-- SAMPLE QUERIES
-- ============================================

-- Get current Devin workload
-- SELECT * FROM get_devin_workload();

-- Get success rate for last 7 days
-- SELECT * FROM get_devin_success_rate(7);

-- Get all failed operations today
-- SELECT * FROM devin_operations 
-- WHERE status = 'failed' AND created_at >= CURRENT_DATE
-- ORDER BY created_at DESC;

-- Get slowest operations this week
-- SELECT directive_id, directive_title, execution_time_ms
-- FROM devin_operations
-- WHERE completed_at >= CURRENT_DATE - INTERVAL '7 days'
-- ORDER BY execution_time_ms DESC
-- LIMIT 10;

-- Aggregate daily telemetry
-- SELECT aggregate_devin_telemetry(
--   'daily',
--   CURRENT_DATE,
--   CURRENT_DATE + INTERVAL '1 day'
-- );
