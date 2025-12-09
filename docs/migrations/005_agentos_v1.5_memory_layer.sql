-- Migration: AgentOS v1.5 - Memory Layer
-- Version: 1.5.0
-- Date: December 6, 2025
-- Description: Agent memory system for context retention across sessions

-- ============================================
-- 1. AGENT_SESSIONS - Conversation Sessions
-- ============================================

CREATE TABLE IF NOT EXISTS agent_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID, -- Nullable for anonymous sessions
  session_key TEXT UNIQUE NOT NULL,
  domain TEXT, -- "legal", "sports", "finance", etc.
  active BOOLEAN DEFAULT true,
  last_activity_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_agent_sessions_user_id ON agent_sessions(user_id);
CREATE INDEX idx_agent_sessions_session_key ON agent_sessions(session_key);
CREATE INDEX idx_agent_sessions_active ON agent_sessions(active);
CREATE INDEX idx_agent_sessions_last_activity ON agent_sessions(last_activity_at DESC);

COMMENT ON TABLE agent_sessions IS 'User conversation sessions for context retention';
COMMENT ON COLUMN agent_sessions.session_key IS 'Client-provided session identifier (UUID or custom)';
COMMENT ON COLUMN agent_sessions.domain IS 'Primary domain for this session';

-- ============================================
-- 2. AGENT_MEMORY_CHUNKS - Memory Storage
-- ============================================

CREATE TABLE IF NOT EXISTS agent_memory_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES agent_sessions(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('preference', 'summary', 'flag', 'note', 'fact', 'decision')),
  label TEXT NOT NULL,
  content TEXT NOT NULL,
  content_json JSONB, -- Structured version of content
  importance INTEGER DEFAULT 3 CHECK (importance >= 1 AND importance <= 5),
  agent_id TEXT, -- Which agent created this memory
  last_used_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_agent_memory_session_id ON agent_memory_chunks(session_id);
CREATE INDEX idx_agent_memory_kind ON agent_memory_chunks(kind);
CREATE INDEX idx_agent_memory_importance ON agent_memory_chunks(importance DESC);
CREATE INDEX idx_agent_memory_last_used ON agent_memory_chunks(last_used_at DESC);
CREATE INDEX idx_agent_memory_agent_id ON agent_memory_chunks(agent_id);

COMMENT ON TABLE agent_memory_chunks IS 'Agent memory storage for preferences, summaries, and context';
COMMENT ON COLUMN agent_memory_chunks.kind IS 'Memory type: preference, summary, flag, note, fact, decision';
COMMENT ON COLUMN agent_memory_chunks.importance IS '1-5: 1=trivial, 5=critical';
COMMENT ON COLUMN agent_memory_chunks.content IS 'Natural language memory content';
COMMENT ON COLUMN agent_memory_chunks.content_json IS 'Structured data version (optional)';

-- ============================================
-- TRIGGERS
-- ============================================

-- Update session last_activity_at when memory is accessed
CREATE OR REPLACE FUNCTION update_session_activity()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE agent_sessions
  SET last_activity_at = now()
  WHERE id = NEW.session_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_session_activity_on_memory
  AFTER INSERT OR UPDATE ON agent_memory_chunks
  FOR EACH ROW
  EXECUTE FUNCTION update_session_activity();

-- ============================================
-- FUNCTIONS
-- ============================================

-- Get or create session
CREATE OR REPLACE FUNCTION get_or_create_session(
  p_session_key TEXT,
  p_user_id UUID DEFAULT NULL,
  p_domain TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_session_id UUID;
BEGIN
  -- Try to find existing session
  SELECT id
  INTO v_session_id
  FROM agent_sessions
  WHERE session_key = p_session_key;
  
  IF v_session_id IS NULL THEN
    -- Create new session
    INSERT INTO agent_sessions (session_key, user_id, domain)
    VALUES (p_session_key, p_user_id, p_domain)
    RETURNING id INTO v_session_id;
  ELSE
    -- Update last activity
    UPDATE agent_sessions
    SET last_activity_at = now()
    WHERE id = v_session_id;
  END IF;
  
  RETURN v_session_id;
END;
$$ LANGUAGE plpgsql;

-- Get recent memories for session
CREATE OR REPLACE FUNCTION get_session_memories(
  p_session_id UUID,
  p_limit INTEGER DEFAULT 10,
  p_min_importance INTEGER DEFAULT 2
)
RETURNS TABLE (
  id UUID,
  kind TEXT,
  label TEXT,
  content TEXT,
  content_json JSONB,
  importance INTEGER,
  agent_id TEXT
) AS $$
BEGIN
  -- Update last_used_at for retrieved memories
  UPDATE agent_memory_chunks
  SET last_used_at = now()
  WHERE session_id = p_session_id
    AND importance >= p_min_importance;
  
  RETURN QUERY
  SELECT 
    m.id,
    m.kind,
    m.label,
    m.content,
    m.content_json,
    m.importance,
    m.agent_id
  FROM agent_memory_chunks m
  WHERE m.session_id = p_session_id
    AND m.importance >= p_min_importance
  ORDER BY m.importance DESC, m.last_used_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Add memory to session
CREATE OR REPLACE FUNCTION add_session_memory(
  p_session_id UUID,
  p_kind TEXT,
  p_label TEXT,
  p_content TEXT,
  p_content_json JSONB DEFAULT NULL,
  p_importance INTEGER DEFAULT 3,
  p_agent_id TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_memory_id UUID;
BEGIN
  INSERT INTO agent_memory_chunks (
    session_id,
    kind,
    label,
    content,
    content_json,
    importance,
    agent_id
  )
  VALUES (
    p_session_id,
    p_kind,
    p_label,
    p_content,
    p_content_json,
    p_importance,
    p_agent_id
  )
  RETURNING id INTO v_memory_id;
  
  RETURN v_memory_id;
END;
$$ LANGUAGE plpgsql;

-- Clean up old sessions (inactive for > 90 days)
CREATE OR REPLACE FUNCTION cleanup_old_sessions()
RETURNS INTEGER AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  WITH deleted AS (
    DELETE FROM agent_sessions
    WHERE last_activity_at < now() - INTERVAL '90 days'
      AND active = false
    RETURNING id
  )
  SELECT COUNT(*) INTO v_deleted_count FROM deleted;
  
  RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Archive session (mark inactive but keep memories)
CREATE OR REPLACE FUNCTION archive_session(p_session_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE agent_sessions
  SET active = false
  WHERE id = p_session_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Get session summary
CREATE OR REPLACE FUNCTION get_session_summary(p_session_id UUID)
RETURNS TABLE (
  session_key TEXT,
  domain TEXT,
  memory_count BIGINT,
  most_recent_memory TIMESTAMPTZ,
  session_age INTERVAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.session_key,
    s.domain,
    COUNT(m.id) as memory_count,
    MAX(m.created_at) as most_recent_memory,
    now() - s.created_at as session_age
  FROM agent_sessions s
  LEFT JOIN agent_memory_chunks m ON m.session_id = s.id
  WHERE s.id = p_session_id
  GROUP BY s.id, s.session_key, s.domain, s.created_at;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE agent_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_memory_chunks ENABLE ROW LEVEL SECURITY;

-- Users can view own sessions
CREATE POLICY "Users can view own sessions"
  ON agent_sessions FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

-- Users can create sessions
CREATE POLICY "Users can create sessions"
  ON agent_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Users can view memories from their sessions
CREATE POLICY "Users can view own memories"
  ON agent_memory_chunks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM agent_sessions
      WHERE id = agent_memory_chunks.session_id
        AND (user_id = auth.uid() OR user_id IS NULL)
    )
  );

-- System can create/update memories
CREATE POLICY "System can manage memories"
  ON agent_memory_chunks FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================
-- ANALYTICS VIEWS
-- ============================================

-- Memory usage by kind
CREATE OR REPLACE VIEW memory_usage_by_kind AS
SELECT 
  kind,
  COUNT(*) as total_chunks,
  AVG(importance) as avg_importance,
  COUNT(DISTINCT session_id) as unique_sessions
FROM agent_memory_chunks
GROUP BY kind
ORDER BY total_chunks DESC;

-- Active sessions summary
CREATE OR REPLACE VIEW active_sessions_summary AS
SELECT 
  s.domain,
  COUNT(DISTINCT s.id) as active_sessions,
  COUNT(m.id) as total_memories,
  AVG(
    (SELECT COUNT(*) FROM agent_memory_chunks WHERE session_id = s.id)
  ) as avg_memories_per_session
FROM agent_sessions s
LEFT JOIN agent_memory_chunks m ON m.session_id = s.id
WHERE s.active = true
  AND s.last_activity_at >= now() - INTERVAL '7 days'
GROUP BY s.domain
ORDER BY active_sessions DESC;

-- ============================================
-- SEED DATA - Example Memories
-- ============================================

-- Example session with memories (for testing)
DO $$
DECLARE
  v_session_id UUID;
BEGIN
  -- Create example session
  v_session_id := get_or_create_session('example-session-001', NULL, 'legal');
  
  -- Add example memories
  PERFORM add_session_memory(
    v_session_id,
    'preference',
    'Prefers detailed explanations',
    'User prefers detailed legal explanations with citations',
    '{"detailLevel": "high", "includeCitations": true}'::jsonb,
    4,
    'ghost-evaluator'
  );
  
  PERFORM add_session_memory(
    v_session_id,
    'summary',
    'Previous evaluation context',
    'User previously evaluated a parenting plan for 2 children ages 5 and 8',
    '{"caseType": "custody", "childCount": 2, "childAges": [5, 8]}'::jsonb,
    3,
    'best-interest'
  );
  
  PERFORM add_session_memory(
    v_session_id,
    'flag',
    'Safety concern noted',
    'Previous evaluation flagged potential safety concern',
    '{"severity": "medium", "category": "supervision"}'::jsonb,
    5,
    'trustshield-guard'
  );
END $$;

COMMENT ON TABLE agent_sessions IS 'Example session created for testing';
