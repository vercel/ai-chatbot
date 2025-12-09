-- Migration: AgentOS v1.5 - Enhanced Telemetry
-- Version: 1.5.0
-- Date: December 6, 2025
-- Description: Upgrade agentos_event_log with pipeline tracking and performance metrics

-- ============================================
-- EXTEND AGENTOS_EVENT_LOG
-- ============================================

-- Add new columns to existing table
ALTER TABLE agentos_event_log
ADD COLUMN IF NOT EXISTS pipeline_id TEXT,
ADD COLUMN IF NOT EXISTS pipeline_execution_id UUID,
ADD COLUMN IF NOT EXISTS app_id TEXT DEFAULT 'tiqology-spa',
ADD COLUMN IF NOT EXISTS score INTEGER,
ADD COLUMN IF NOT EXISTS duration_ms INTEGER;

-- Rename 'event_type' to 'status' (if needed) - keeping both for backwards compatibility
ALTER TABLE agentos_event_log
ADD COLUMN IF NOT EXISTS status TEXT CHECK (status IN ('started', 'success', 'error', 'timeout', 'cancelled'));

-- Update existing rows to set status from event_type
UPDATE agentos_event_log
SET status = CASE 
  WHEN event_type LIKE '%completed%' THEN 'success'
  WHEN event_type LIKE '%failed%' THEN 'error'
  WHEN event_type LIKE '%started%' THEN 'started'
  ELSE 'success'
END
WHERE status IS NULL;

-- Add indexes for new columns
CREATE INDEX IF NOT EXISTS idx_agentos_event_pipeline_id ON agentos_event_log(pipeline_id);
CREATE INDEX IF NOT EXISTS idx_agentos_event_pipeline_exec_id ON agentos_event_log(pipeline_execution_id);
CREATE INDEX IF NOT EXISTS idx_agentos_event_app_id ON agentos_event_log(app_id);
CREATE INDEX IF NOT EXISTS idx_agentos_event_status ON agentos_event_log(status);
CREATE INDEX IF NOT EXISTS idx_agentos_event_duration ON agentos_event_log(duration_ms);

-- Update table comment
COMMENT ON COLUMN agentos_event_log.pipeline_id IS 'Pipeline ID if this event is part of a pipeline';
COMMENT ON COLUMN agentos_event_log.pipeline_execution_id IS 'Specific pipeline execution ID';
COMMENT ON COLUMN agentos_event_log.app_id IS 'Source application: tiqology-spa, mobile, api, etc.';
COMMENT ON COLUMN agentos_event_log.score IS 'Evaluation score (0-100) if applicable';
COMMENT ON COLUMN agentos_event_log.duration_ms IS 'Execution duration in milliseconds';
COMMENT ON COLUMN agentos_event_log.status IS 'Event status: started, success, error, timeout, cancelled';

-- ============================================
-- ANALYTICS FUNCTIONS
-- ============================================

-- Get top agents by usage
CREATE OR REPLACE FUNCTION get_top_agents(
  p_limit INTEGER DEFAULT 10,
  p_days INTEGER DEFAULT 30
)
RETURNS TABLE (
  agent_id TEXT,
  total_executions BIGINT,
  success_count BIGINT,
  error_count BIGINT,
  avg_duration_ms NUMERIC,
  success_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.agent_id,
    COUNT(*) as total_executions,
    COUNT(CASE WHEN e.status = 'success' THEN 1 END) as success_count,
    COUNT(CASE WHEN e.status = 'error' THEN 1 END) as error_count,
    AVG(e.duration_ms) as avg_duration_ms,
    ROUND(
      COUNT(CASE WHEN e.status = 'success' THEN 1 END)::NUMERIC / 
      NULLIF(COUNT(*), 0) * 100,
      2
    ) as success_rate
  FROM agentos_event_log e
  WHERE e.created_at >= now() - (p_days || ' days')::INTERVAL
    AND e.agent_id IS NOT NULL
  GROUP BY e.agent_id
  ORDER BY total_executions DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- Get top pipelines by usage
CREATE OR REPLACE FUNCTION get_top_pipelines(
  p_limit INTEGER DEFAULT 10,
  p_days INTEGER DEFAULT 30
)
RETURNS TABLE (
  pipeline_id TEXT,
  total_executions BIGINT,
  avg_duration_ms NUMERIC,
  success_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.pipeline_id,
    COUNT(DISTINCT e.pipeline_execution_id) as total_executions,
    AVG(e.duration_ms) as avg_duration_ms,
    ROUND(
      COUNT(CASE WHEN e.status = 'success' THEN 1 END)::NUMERIC / 
      NULLIF(COUNT(*), 0) * 100,
      2
    ) as success_rate
  FROM agentos_event_log e
  WHERE e.created_at >= now() - (p_days || ' days')::INTERVAL
    AND e.pipeline_id IS NOT NULL
  GROUP BY e.pipeline_id
  ORDER BY total_executions DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- Get system health metrics
CREATE OR REPLACE FUNCTION get_system_health_metrics(p_hours INTEGER DEFAULT 24)
RETURNS TABLE (
  total_requests BIGINT,
  success_count BIGINT,
  error_count BIGINT,
  timeout_count BIGINT,
  avg_response_time_ms NUMERIC,
  p95_response_time_ms NUMERIC,
  success_rate NUMERIC,
  error_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_requests,
    COUNT(CASE WHEN status = 'success' THEN 1 END) as success_count,
    COUNT(CASE WHEN status = 'error' THEN 1 END) as error_count,
    COUNT(CASE WHEN status = 'timeout' THEN 1 END) as timeout_count,
    AVG(duration_ms) as avg_response_time_ms,
    PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY duration_ms) as p95_response_time_ms,
    ROUND(
      COUNT(CASE WHEN status = 'success' THEN 1 END)::NUMERIC / 
      NULLIF(COUNT(*), 0) * 100,
      2
    ) as success_rate,
    ROUND(
      COUNT(CASE WHEN status = 'error' THEN 1 END)::NUMERIC / 
      NULLIF(COUNT(*), 0) * 100,
      2
    ) as error_rate
  FROM agentos_event_log
  WHERE created_at >= now() - (p_hours || ' hours')::INTERVAL;
END;
$$ LANGUAGE plpgsql STABLE;

-- Get hourly request volume
CREATE OR REPLACE FUNCTION get_hourly_request_volume(p_hours INTEGER DEFAULT 24)
RETURNS TABLE (
  hour_bucket TIMESTAMPTZ,
  request_count BIGINT,
  avg_duration_ms NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    date_trunc('hour', created_at) as hour_bucket,
    COUNT(*) as request_count,
    AVG(duration_ms) as avg_duration_ms
  FROM agentos_event_log
  WHERE created_at >= now() - (p_hours || ' hours')::INTERVAL
  GROUP BY hour_bucket
  ORDER BY hour_bucket DESC;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================
-- ANALYTICS VIEWS
-- ============================================

-- Real-time dashboard metrics (last 1 hour)
CREATE OR REPLACE VIEW realtime_dashboard_metrics AS
SELECT 
  COUNT(*) as total_requests_1h,
  COUNT(CASE WHEN status = 'success' THEN 1 END) as success_count_1h,
  COUNT(CASE WHEN status = 'error' THEN 1 END) as error_count_1h,
  AVG(duration_ms) as avg_response_time_ms_1h,
  ROUND(
    COUNT(CASE WHEN status = 'success' THEN 1 END)::NUMERIC / 
    NULLIF(COUNT(*), 0) * 100,
    2
  ) as success_rate_1h
FROM agentos_event_log
WHERE created_at >= now() - INTERVAL '1 hour';

-- Agent performance comparison
CREATE OR REPLACE VIEW agent_performance_comparison AS
SELECT 
  a.id,
  a.name,
  a.domain,
  a.cost_score,
  a.latency_score,
  COUNT(e.id) as total_executions,
  AVG(e.duration_ms) as actual_avg_duration_ms,
  ROUND(
    COUNT(CASE WHEN e.status = 'success' THEN 1 END)::NUMERIC / 
    NULLIF(COUNT(e.id), 0) * 100,
    2
  ) as actual_success_rate,
  -- Compare predicted vs actual latency
  CASE 
    WHEN AVG(e.duration_ms) <= a.latency_score * 1000 THEN 'better'
    WHEN AVG(e.duration_ms) <= a.latency_score * 1500 THEN 'as_expected'
    ELSE 'worse'
  END as latency_performance
FROM tiq_agents a
LEFT JOIN agentos_event_log e ON e.agent_id = a.id
WHERE e.created_at >= now() - INTERVAL '7 days'
GROUP BY a.id, a.name, a.domain, a.cost_score, a.latency_score
ORDER BY total_executions DESC;

-- App usage breakdown
CREATE OR REPLACE VIEW app_usage_breakdown AS
SELECT 
  app_id,
  COUNT(*) as total_requests,
  COUNT(DISTINCT user_id) as unique_users,
  AVG(duration_ms) as avg_duration_ms,
  ROUND(
    COUNT(CASE WHEN status = 'success' THEN 1 END)::NUMERIC / 
    NULLIF(COUNT(*), 0) * 100,
    2
  ) as success_rate
FROM agentos_event_log
WHERE created_at >= now() - INTERVAL '7 days'
GROUP BY app_id
ORDER BY total_requests DESC;

-- Error analysis
CREATE OR REPLACE VIEW error_analysis AS
SELECT 
  agent_id,
  error_message,
  COUNT(*) as error_count,
  MAX(created_at) as last_occurrence,
  AVG(duration_ms) as avg_duration_before_error
FROM agentos_event_log
WHERE status = 'error'
  AND created_at >= now() - INTERVAL '7 days'
GROUP BY agent_id, error_message
ORDER BY error_count DESC, last_occurrence DESC
LIMIT 100;

COMMENT ON VIEW realtime_dashboard_metrics IS 'Real-time metrics for last 1 hour';
COMMENT ON VIEW agent_performance_comparison IS 'Compare predicted vs actual agent performance';
COMMENT ON VIEW app_usage_breakdown IS 'Request breakdown by source application';
COMMENT ON VIEW error_analysis IS 'Top errors by agent (last 7 days)';

-- ============================================
-- DASHBOARD DATA EXPORT
-- ============================================

-- Generate complete dashboard snapshot
CREATE OR REPLACE FUNCTION generate_dashboard_snapshot()
RETURNS JSONB AS $$
DECLARE
  v_snapshot JSONB;
BEGIN
  SELECT jsonb_build_object(
    'timestamp', now(),
    'realtime', (SELECT row_to_json(r) FROM realtime_dashboard_metrics r),
    'topAgents', (SELECT jsonb_agg(row_to_json(a)) FROM get_top_agents(5, 7) a),
    'topPipelines', (SELECT jsonb_agg(row_to_json(p)) FROM get_top_pipelines(5, 7) p),
    'systemHealth', (SELECT row_to_json(h) FROM get_system_health_metrics(24) h),
    'appBreakdown', (SELECT jsonb_agg(row_to_json(a)) FROM app_usage_breakdown a),
    'recentErrors', (SELECT jsonb_agg(row_to_json(e)) FROM (SELECT * FROM error_analysis LIMIT 10) e)
  ) INTO v_snapshot;
  
  RETURN v_snapshot;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION generate_dashboard_snapshot IS 'Generate complete dashboard data for TiQology SPA';
