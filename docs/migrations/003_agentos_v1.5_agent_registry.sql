-- Migration: AgentOS v1.5 - Agent Registry
-- Version: 1.5.0
-- Date: December 6, 2025
-- Description: Global agent registry with capabilities, permissions, and cost/latency scoring

-- ============================================
-- 1. TIQ_AGENTS - Global Agent Registry
-- ============================================

CREATE TABLE IF NOT EXISTS tiq_agents (
  id TEXT PRIMARY KEY, -- e.g. "ghost-evaluator", "best-interest"
  name TEXT NOT NULL,
  domain TEXT NOT NULL, -- "legal" | "sports" | "finance" | "build" | "travel" | "security" | "system"
  description TEXT,
  modes JSONB DEFAULT '["fast"]'::jsonb, -- Supported modes: fast, deep, batch
  cost_score INTEGER DEFAULT 5 CHECK (cost_score >= 1 AND cost_score <= 10),
  latency_score INTEGER DEFAULT 5 CHECK (latency_score >= 1 AND latency_score <= 10),
  risk_level TEXT DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high')),
  enabled BOOLEAN DEFAULT true,
  min_role TEXT DEFAULT 'user' CHECK (min_role IN ('user', 'pro', 'lawyer', 'admin')),
  endpoint_url TEXT, -- API endpoint (if external)
  api_key_encrypted TEXT, -- Encrypted API key (if required)
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_tiq_agents_domain ON tiq_agents(domain);
CREATE INDEX idx_tiq_agents_enabled ON tiq_agents(enabled);
CREATE INDEX idx_tiq_agents_min_role ON tiq_agents(min_role);
CREATE INDEX idx_tiq_agents_risk_level ON tiq_agents(risk_level);

COMMENT ON TABLE tiq_agents IS 'Global registry of all TiQology AI agents';
COMMENT ON COLUMN tiq_agents.id IS 'Unique agent identifier (kebab-case)';
COMMENT ON COLUMN tiq_agents.cost_score IS '1-10: 1=cheapest, 10=most expensive';
COMMENT ON COLUMN tiq_agents.latency_score IS '1-10: 1=fastest, 10=slowest';
COMMENT ON COLUMN tiq_agents.min_role IS 'Minimum user role required to access agent';
COMMENT ON COLUMN tiq_agents.modes IS 'Supported execution modes: fast, deep, batch';

-- ============================================
-- TRIGGERS
-- ============================================

CREATE TRIGGER update_tiq_agents_updated_at
  BEFORE UPDATE ON tiq_agents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SEED DATA - Core Agents
-- ============================================

INSERT INTO tiq_agents (id, name, domain, description, modes, cost_score, latency_score, risk_level, min_role, metadata)
VALUES 
  -- Legal Intelligence
  (
    'ghost-evaluator',
    'Ghost Evaluator',
    'legal',
    'AI-powered legal document evaluator with 0-100 scoring',
    '["fast", "deep"]'::jsonb,
    5, -- Medium cost
    6, -- Moderate latency
    'low',
    'user',
    '{"modelTypes": ["chat-model", "chat-model-reasoning"], "maxTokens": 4000}'::jsonb
  ),
  (
    'best-interest',
    'Best Interest Engine',
    'legal',
    'Best Interest of the Child evaluator with 4-dimensional analysis',
    '["deep"]'::jsonb,
    8, -- High cost (reasoning model)
    9, -- High latency (deep reasoning)
    'medium',
    'user',
    '{"dimensions": ["Stability", "Emotional", "Safety", "Development"]}'::jsonb
  ),
  
  -- System Agents
  (
    'devin-builder',
    'Devin Builder',
    'system',
    'Senior software engineer agent for code generation and refactoring',
    '["deep", "batch"]'::jsonb,
    7,
    8,
    'low',
    'admin',
    '{"languages": ["typescript", "python", "sql"], "frameworks": ["next.js", "react", "supabase"]}'::jsonb
  ),
  (
    'rocket-ops',
    'Rocket Ops',
    'system',
    'DevOps automation agent for deployments and infrastructure',
    '["fast", "batch"]'::jsonb,
    3,
    4,
    'medium',
    'admin',
    '{"platforms": ["vercel", "supabase", "github-actions"]}'::jsonb
  ),
  
  -- Future Build Lab
  (
    'future-build-lab',
    'Future Build Lab',
    'build',
    'AI-powered futuristic building plan generator',
    '["fast", "deep"]'::jsonb,
    9, -- High cost (image generation)
    7,
    'low',
    'user',
    '{"imageModels": ["dall-e-3", "midjourney"], "outputFormats": ["png", "jpg", "cad"]}'::jsonb
  ),
  
  -- FanOps (Sports)
  (
    'fanops-trip',
    'FanOps Trip Planner',
    'sports',
    'Sports event travel planner and mission coordinator',
    '["fast"]'::jsonb,
    4,
    5,
    'low',
    'user',
    '{"apis": ["espn", "sportradar", "mapbox"], "features": ["missions", "safety", "discounts"]}'::jsonb
  ),
  
  -- EarnHub (Finance)
  (
    'survey-hunter',
    'Survey Hunter',
    'finance',
    'Survey matching and passive income optimizer',
    '["fast", "batch"]'::jsonb,
    2, -- Low cost
    3, -- Fast
    'low',
    'user',
    '{"vendors": ["pollfish", "cint", "dynata"], "matchingAlgorithm": "ai-powered"}'::jsonb
  ),
  
  -- TrustShield (Security)
  (
    'trustshield-guard',
    'TrustShield Guard',
    'security',
    'Threat detection and fraud prevention agent',
    '["fast"]'::jsonb,
    6,
    2, -- Very fast
    'high',
    'user',
    '{"checks": ["fraud", "abuse", "anomaly"], "actions": ["alert", "block", "escalate"]}'::jsonb
  )
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- FUNCTIONS
-- ============================================

-- Get agents by domain
CREATE OR REPLACE FUNCTION get_agents_by_domain(p_domain TEXT)
RETURNS TABLE (
  id TEXT,
  name TEXT,
  description TEXT,
  modes JSONB,
  cost_score INTEGER,
  latency_score INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id,
    a.name,
    a.description,
    a.modes,
    a.cost_score,
    a.latency_score
  FROM tiq_agents a
  WHERE a.domain = p_domain
    AND a.enabled = true
  ORDER BY a.cost_score ASC, a.latency_score ASC;
END;
$$ LANGUAGE plpgsql STABLE;

-- Check if agent is enabled for role
CREATE OR REPLACE FUNCTION is_agent_enabled_for_role(
  p_agent_id TEXT,
  p_user_role TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_min_role TEXT;
  v_enabled BOOLEAN;
  v_role_hierarchy INTEGER;
  v_required_hierarchy INTEGER;
BEGIN
  -- Role hierarchy: user < pro < lawyer < admin
  CASE p_user_role
    WHEN 'user' THEN v_role_hierarchy := 1;
    WHEN 'pro' THEN v_role_hierarchy := 2;
    WHEN 'lawyer' THEN v_role_hierarchy := 3;
    WHEN 'admin' THEN v_role_hierarchy := 4;
    ELSE v_role_hierarchy := 0;
  END CASE;
  
  -- Get agent min_role
  SELECT min_role, enabled
  INTO v_min_role, v_enabled
  FROM tiq_agents
  WHERE id = p_agent_id;
  
  IF v_min_role IS NULL THEN
    RETURN false; -- Agent doesn't exist
  END IF;
  
  IF NOT v_enabled THEN
    RETURN false; -- Agent disabled
  END IF;
  
  -- Check role hierarchy
  CASE v_min_role
    WHEN 'user' THEN v_required_hierarchy := 1;
    WHEN 'pro' THEN v_required_hierarchy := 2;
    WHEN 'lawyer' THEN v_required_hierarchy := 3;
    WHEN 'admin' THEN v_required_hierarchy := 4;
    ELSE v_required_hierarchy := 5; -- Unknown role, deny access
  END CASE;
  
  RETURN v_role_hierarchy >= v_required_hierarchy;
END;
$$ LANGUAGE plpgsql STABLE;

-- Get recommended agent for task
CREATE OR REPLACE FUNCTION get_recommended_agent(
  p_domain TEXT,
  p_mode TEXT DEFAULT 'fast',
  p_max_cost INTEGER DEFAULT 10,
  p_max_latency INTEGER DEFAULT 10
)
RETURNS TEXT AS $$
DECLARE
  v_agent_id TEXT;
BEGIN
  SELECT id
  INTO v_agent_id
  FROM tiq_agents
  WHERE domain = p_domain
    AND enabled = true
    AND cost_score <= p_max_cost
    AND latency_score <= p_max_latency
    AND modes @> to_jsonb(p_mode)
  ORDER BY 
    cost_score ASC,
    latency_score ASC
  LIMIT 1;
  
  RETURN v_agent_id;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE tiq_agents ENABLE ROW LEVEL SECURITY;

-- Everyone can view enabled agents
CREATE POLICY "Anyone can view enabled agents"
  ON tiq_agents FOR SELECT
  USING (enabled = true);

-- Only admins can modify agents
CREATE POLICY "Admins can manage agents"
  ON tiq_agents FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
        AND metadata->>'role' = 'admin'
    )
  );

-- ============================================
-- ANALYTICS VIEWS
-- ============================================

-- Agent usage summary
CREATE OR REPLACE VIEW agent_usage_summary AS
SELECT 
  a.id,
  a.name,
  a.domain,
  COUNT(e.id) as total_executions,
  AVG(e.duration_ms) as avg_duration_ms,
  COUNT(CASE WHEN e.status = 'success' THEN 1 END) as success_count,
  COUNT(CASE WHEN e.status = 'error' THEN 1 END) as error_count,
  ROUND(
    COUNT(CASE WHEN e.status = 'success' THEN 1 END)::NUMERIC / 
    NULLIF(COUNT(e.id), 0) * 100,
    2
  ) as success_rate
FROM tiq_agents a
LEFT JOIN agentos_event_log e ON e.agent_id = a.id
WHERE e.created_at >= now() - INTERVAL '30 days'
GROUP BY a.id, a.name, a.domain
ORDER BY total_executions DESC;

COMMENT ON VIEW agent_usage_summary IS 'Agent usage statistics (last 30 days)';
