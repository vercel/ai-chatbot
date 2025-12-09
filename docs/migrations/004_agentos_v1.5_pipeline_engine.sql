-- Migration: AgentOS v1.5 - Pipeline Engine
-- Version: 1.5.0
-- Date: December 6, 2025
-- Description: Multi-agent pipeline orchestration with conditional logic

-- ============================================
-- 1. TIQ_PIPELINES - Pipeline Definitions
-- ============================================

CREATE TABLE IF NOT EXISTS tiq_pipelines (
  id TEXT PRIMARY KEY, -- e.g. "best-interest-full-eval"
  name TEXT NOT NULL,
  description TEXT,
  steps JSONB NOT NULL, -- Array of pipeline steps
  enabled BOOLEAN DEFAULT true,
  min_role TEXT DEFAULT 'user' CHECK (min_role IN ('user', 'pro', 'lawyer', 'admin')),
  version INTEGER DEFAULT 1,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_tiq_pipelines_enabled ON tiq_pipelines(enabled);
CREATE INDEX idx_tiq_pipelines_min_role ON tiq_pipelines(min_role);

COMMENT ON TABLE tiq_pipelines IS 'Multi-agent pipeline definitions with sequential/conditional logic';
COMMENT ON COLUMN tiq_pipelines.steps IS 'Array of pipeline steps with agent IDs, inputs, and conditions';
COMMENT ON COLUMN tiq_pipelines.version IS 'Pipeline version number (auto-incremented on updates)';

-- ============================================
-- 2. PIPELINE_EXECUTIONS - Execution History
-- ============================================

CREATE TABLE IF NOT EXISTS pipeline_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_id TEXT NOT NULL REFERENCES tiq_pipelines(id),
  user_id UUID,
  session_id UUID, -- Link to agent_sessions
  status TEXT DEFAULT 'running' CHECK (status IN ('running', 'success', 'error', 'timeout', 'cancelled')),
  steps_completed INTEGER DEFAULT 0,
  total_steps INTEGER NOT NULL,
  results_by_step JSONB DEFAULT '{}'::jsonb,
  overall_summary JSONB,
  error_message TEXT,
  duration_ms INTEGER,
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_pipeline_executions_pipeline_id ON pipeline_executions(pipeline_id);
CREATE INDEX idx_pipeline_executions_user_id ON pipeline_executions(user_id);
CREATE INDEX idx_pipeline_executions_status ON pipeline_executions(status);
CREATE INDEX idx_pipeline_executions_started_at ON pipeline_executions(started_at DESC);

COMMENT ON TABLE pipeline_executions IS 'Pipeline execution history with results and performance metrics';

-- ============================================
-- TRIGGERS
-- ============================================

CREATE TRIGGER update_tiq_pipelines_updated_at
  BEFORE UPDATE ON tiq_pipelines
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Auto-increment version on pipeline update
CREATE OR REPLACE FUNCTION increment_pipeline_version()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.steps IS DISTINCT FROM OLD.steps THEN
    NEW.version := OLD.version + 1;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER increment_pipeline_version_trigger
  BEFORE UPDATE ON tiq_pipelines
  FOR EACH ROW
  EXECUTE FUNCTION increment_pipeline_version();

-- ============================================
-- SEED DATA - Core Pipelines
-- ============================================

INSERT INTO tiq_pipelines (id, name, description, steps, min_role, metadata)
VALUES 
  -- Best Interest Full Evaluation
  (
    'best-interest-full-eval',
    'Best Interest Full Evaluation',
    'Comprehensive 4-dimensional analysis with Ghost validation and safety checks',
    '[
      {
        "agentId": "best-interest",
        "input": "full_case",
        "saveResultAs": "bestInterestResult",
        "mode": "deep"
      },
      {
        "agentId": "ghost-evaluator",
        "input": "narrative_only",
        "saveResultAs": "ghostCheck",
        "mode": "fast"
      },
      {
        "type": "conditional",
        "if": "ghostCheck.score < 60",
        "then": [
          {
            "agentId": "trustshield-guard",
            "input": "full_case",
            "saveResultAs": "safetyAlert"
          }
        ]
      }
    ]'::jsonb,
    'user',
    '{"estimatedDuration": "15-30s", "totalAgents": 3}'::jsonb
  ),
  
  -- Quick Legal Assessment
  (
    'quick-legal-assessment',
    'Quick Legal Assessment',
    'Fast evaluation with Ghost for basic document review',
    '[
      {
        "agentId": "ghost-evaluator",
        "input": "document",
        "saveResultAs": "evaluation",
        "mode": "fast"
      }
    ]'::jsonb,
    'user',
    '{"estimatedDuration": "5-8s", "totalAgents": 1}'::jsonb
  ),
  
  -- Sports Event Full Planning
  (
    'fanops-full-planning',
    'FanOps Full Event Planning',
    'Travel planning with mission discovery and discount negotiation',
    '[
      {
        "agentId": "fanops-trip",
        "input": "event_details",
        "saveResultAs": "travelPlan",
        "mode": "fast"
      },
      {
        "agentId": "survey-hunter",
        "input": "user_profile",
        "saveResultAs": "earningOpportunities",
        "mode": "fast"
      }
    ]'::jsonb,
    'user',
    '{"estimatedDuration": "8-12s", "totalAgents": 2}'::jsonb
  ),
  
  -- Security Threat Analysis
  (
    'security-threat-analysis',
    'Security Threat Analysis',
    'Multi-layer security check for suspicious activity',
    '[
      {
        "agentId": "trustshield-guard",
        "input": "user_activity",
        "saveResultAs": "threatScore",
        "mode": "fast"
      },
      {
        "type": "conditional",
        "if": "threatScore.score >= 70",
        "then": [
          {
            "agentId": "rocket-ops",
            "input": "alert_data",
            "saveResultAs": "escalation",
            "mode": "fast"
          }
        ]
      }
    ]'::jsonb,
    'admin',
    '{"estimatedDuration": "2-5s", "totalAgents": 2}'::jsonb
  )
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- FUNCTIONS
-- ============================================

-- Get pipelines by domain
CREATE OR REPLACE FUNCTION get_pipelines_by_domain(p_domain TEXT)
RETURNS TABLE (
  id TEXT,
  name TEXT,
  description TEXT,
  total_agents INTEGER,
  estimated_duration TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.description,
    (p.metadata->>'totalAgents')::INTEGER as total_agents,
    p.metadata->>'estimatedDuration' as estimated_duration
  FROM tiq_pipelines p
  WHERE p.enabled = true
    AND EXISTS (
      SELECT 1
      FROM jsonb_array_elements(p.steps) step
      WHERE step->>'agentId' IN (
        SELECT a.id FROM tiq_agents a WHERE a.domain = p_domain
      )
    )
  ORDER BY p.name;
END;
$$ LANGUAGE plpgsql STABLE;

-- Get pipeline execution stats
CREATE OR REPLACE FUNCTION get_pipeline_stats(p_pipeline_id TEXT)
RETURNS TABLE (
  total_executions BIGINT,
  success_count BIGINT,
  error_count BIGINT,
  avg_duration_ms NUMERIC,
  success_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_executions,
    COUNT(CASE WHEN status = 'success' THEN 1 END) as success_count,
    COUNT(CASE WHEN status = 'error' THEN 1 END) as error_count,
    AVG(duration_ms) as avg_duration_ms,
    ROUND(
      COUNT(CASE WHEN status = 'success' THEN 1 END)::NUMERIC / 
      NULLIF(COUNT(*), 0) * 100,
      2
    ) as success_rate
  FROM pipeline_executions
  WHERE pipeline_id = p_pipeline_id
    AND started_at >= now() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE tiq_pipelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_executions ENABLE ROW LEVEL SECURITY;

-- Everyone can view enabled pipelines
CREATE POLICY "Anyone can view enabled pipelines"
  ON tiq_pipelines FOR SELECT
  USING (enabled = true);

-- Only admins can modify pipelines
CREATE POLICY "Admins can manage pipelines"
  ON tiq_pipelines FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
        AND metadata->>'role' = 'admin'
    )
  );

-- Users can view own pipeline executions
CREATE POLICY "Users can view own executions"
  ON pipeline_executions FOR SELECT
  USING (auth.uid() = user_id);

-- System can create/update executions
CREATE POLICY "System can manage executions"
  ON pipeline_executions FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================
-- ANALYTICS VIEWS
-- ============================================

-- Pipeline performance summary
CREATE OR REPLACE VIEW pipeline_performance_summary AS
SELECT 
  p.id,
  p.name,
  COUNT(e.id) as total_executions,
  AVG(e.duration_ms) as avg_duration_ms,
  COUNT(CASE WHEN e.status = 'success' THEN 1 END) as success_count,
  COUNT(CASE WHEN e.status = 'error' THEN 1 END) as error_count,
  ROUND(
    COUNT(CASE WHEN e.status = 'success' THEN 1 END)::NUMERIC / 
    NULLIF(COUNT(e.id), 0) * 100,
    2
  ) as success_rate,
  MAX(e.started_at) as last_execution_at
FROM tiq_pipelines p
LEFT JOIN pipeline_executions e ON e.pipeline_id = p.id
WHERE e.started_at >= now() - INTERVAL '30 days'
GROUP BY p.id, p.name
ORDER BY total_executions DESC;

COMMENT ON VIEW pipeline_performance_summary IS 'Pipeline performance metrics (last 30 days)';
