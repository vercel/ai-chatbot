-- TiQology Autonomous Intelligence Fabric (AIF) Database Schema
-- Supporting tables for Neural Mesh, Agent Swarm, Privacy Mesh, and Model Optimizer

-- Privacy Mesh Tables

CREATE TABLE IF NOT EXISTS privacy_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  purpose VARCHAR(255) NOT NULL,
  granted BOOLEAN NOT NULL DEFAULT false,
  granted_at TIMESTAMP WITH TIME ZONE,
  revoked_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, purpose)
);

CREATE INDEX IF NOT EXISTS idx_privacy_consents_user ON privacy_consents(user_id);
CREATE INDEX IF NOT EXISTS idx_privacy_consents_purpose ON privacy_consents(purpose);

-- Immutable audit trail for compliance
CREATE TABLE IF NOT EXISTS privacy_audit_logs (
  id UUID PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL, -- Can be 'ERASED' for deleted users
  action VARCHAR(255) NOT NULL,
  data_type VARCHAR(255) NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  compliance_flags TEXT[] NOT NULL DEFAULT '{}',
  signature VARCHAR(512) NOT NULL, -- Cryptographic signature for tamper detection
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_privacy_audit_user ON privacy_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_privacy_audit_timestamp ON privacy_audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_privacy_audit_action ON privacy_audit_logs(action);

-- Model Optimizer Tables

CREATE TABLE IF NOT EXISTS model_metrics (
  id BIGSERIAL PRIMARY KEY,
  model_id VARCHAR(255) NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  latency INTEGER NOT NULL, -- milliseconds
  accuracy DECIMAL(5,4) NOT NULL, -- 0.0000 to 1.0000
  user_satisfaction DECIMAL(5,4) NOT NULL,
  cost DECIMAL(10,6) NOT NULL, -- USD
  error_rate DECIMAL(5,4) NOT NULL,
  throughput INTEGER NOT NULL, -- tokens
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_model_metrics_model ON model_metrics(model_id);
CREATE INDEX IF NOT EXISTS idx_model_metrics_timestamp ON model_metrics(timestamp DESC);

-- Prompt performance tracking
CREATE TABLE IF NOT EXISTS prompt_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt TEXT NOT NULL,
  model_id VARCHAR(255) NOT NULL,
  avg_latency INTEGER NOT NULL,
  avg_accuracy DECIMAL(5,4) NOT NULL,
  avg_satisfaction DECIMAL(5,4) NOT NULL,
  usage_count INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prompt_performance_model ON prompt_performance(model_id);

-- Optimized prompt variants for A/B testing
CREATE TABLE IF NOT EXISTS prompt_variants (
  id VARCHAR(255) PRIMARY KEY,
  original_prompt TEXT NOT NULL,
  optimized_prompt TEXT NOT NULL,
  performance_gain DECIMAL(5,4) DEFAULT 0,
  test_count INTEGER NOT NULL DEFAULT 0,
  success_rate DECIMAL(5,4) DEFAULT 0,
  avg_latency INTEGER DEFAULT 0,
  status VARCHAR(50) NOT NULL DEFAULT 'testing',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prompt_variants_status ON prompt_variants(status);

-- Hyperparameter configurations
CREATE TABLE IF NOT EXISTS hyperparameter_configs (
  id BIGSERIAL PRIMARY KEY,
  model_id VARCHAR(255) NOT NULL,
  temperature DECIMAL(3,2) NOT NULL,
  top_p DECIMAL(3,2) NOT NULL,
  max_tokens INTEGER NOT NULL,
  frequency_penalty DECIMAL(3,2) NOT NULL,
  presence_penalty DECIMAL(3,2) NOT NULL,
  performance_score DECIMAL(5,4) NOT NULL,
  recommended_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hyperparameter_model ON hyperparameter_configs(model_id);
CREATE INDEX IF NOT EXISTS idx_hyperparameter_recommended ON hyperparameter_configs(recommended_at DESC);

-- Model recommendations
CREATE TABLE IF NOT EXISTS model_recommendations (
  id BIGSERIAL PRIMARY KEY,
  recommendations JSONB NOT NULL,
  generated_at TIMESTAMP WITH TIME ZONE NOT NULL,
  metric_window_hours INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_model_recommendations_generated ON model_recommendations(generated_at DESC);

-- Agent Swarm Tables

CREATE TABLE IF NOT EXISTS agent_tasks (
  id VARCHAR(255) PRIMARY KEY,
  agent_id VARCHAR(255) NOT NULL,
  type VARCHAR(100) NOT NULL,
  priority VARCHAR(20) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  input JSONB NOT NULL,
  result JSONB,
  error TEXT,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  correlation_id VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agent_tasks_agent ON agent_tasks(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_tasks_status ON agent_tasks(status);
CREATE INDEX IF NOT EXISTS idx_agent_tasks_correlation ON agent_tasks(correlation_id);

-- Neural Mesh Tables

CREATE TABLE IF NOT EXISTS neural_mesh_nodes (
  id VARCHAR(255) PRIMARY KEY,
  type VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'online',
  last_heartbeat TIMESTAMP WITH TIME ZONE NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_neural_mesh_type ON neural_mesh_nodes(type);
CREATE INDEX IF NOT EXISTS idx_neural_mesh_status ON neural_mesh_nodes(status);

-- Neural Mesh message history (for debugging/replay)
CREATE TABLE IF NOT EXISTS neural_mesh_messages (
  id BIGSERIAL PRIMARY KEY,
  event VARCHAR(100) NOT NULL,
  source VARCHAR(255) NOT NULL,
  target VARCHAR(255),
  payload JSONB NOT NULL,
  timestamp BIGINT NOT NULL,
  correlation_id VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_neural_mesh_messages_event ON neural_mesh_messages(event);
CREATE INDEX IF NOT EXISTS idx_neural_mesh_messages_source ON neural_mesh_messages(source);
CREATE INDEX IF NOT EXISTS idx_neural_mesh_messages_timestamp ON neural_mesh_messages(timestamp DESC);

-- System Health Monitoring

CREATE TABLE IF NOT EXISTS system_health_snapshots (
  id BIGSERIAL PRIMARY KEY,
  snapshot_time TIMESTAMP WITH TIME ZONE NOT NULL,
  total_nodes INTEGER NOT NULL,
  active_nodes INTEGER NOT NULL,
  offline_nodes INTEGER NOT NULL,
  nodes_by_type JSONB NOT NULL,
  total_tasks INTEGER NOT NULL,
  active_tasks INTEGER NOT NULL,
  completed_tasks INTEGER NOT NULL,
  failed_tasks INTEGER NOT NULL,
  avg_latency INTEGER NOT NULL,
  error_rate DECIMAL(5,4) NOT NULL,
  cost_per_hour DECIMAL(10,6) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_system_health_time ON system_health_snapshots(snapshot_time DESC);

-- Performance Optimization Recommendations

CREATE TABLE IF NOT EXISTS optimization_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(100) NOT NULL, -- 'prompt', 'hyperparameter', 'model_selection', 'scaling'
  priority VARCHAR(20) NOT NULL, -- 'low', 'normal', 'high', 'critical'
  description TEXT NOT NULL,
  impact_estimate DECIMAL(5,4) NOT NULL, -- Expected improvement (0-1)
  cost_impact DECIMAL(10,6) NOT NULL, -- USD per month
  implementation_effort VARCHAR(50) NOT NULL, -- 'low', 'medium', 'high'
  status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'deployed', 'rejected'
  recommended_at TIMESTAMP WITH TIME ZONE NOT NULL,
  deployed_at TIMESTAMP WITH TIME ZONE,
  actual_impact DECIMAL(5,4),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_optimization_type ON optimization_recommendations(type);
CREATE INDEX IF NOT EXISTS idx_optimization_status ON optimization_recommendations(status);
CREATE INDEX IF NOT EXISTS idx_optimization_priority ON optimization_recommendations(priority);

-- Comments and metadata
COMMENT ON TABLE privacy_consents IS 'User consent records for GDPR/CCPA compliance';
COMMENT ON TABLE privacy_audit_logs IS 'Immutable audit trail for privacy compliance (SOC2, GDPR, HIPAA)';
COMMENT ON TABLE model_metrics IS 'Real-time AI model performance metrics';
COMMENT ON TABLE prompt_variants IS 'A/B testing variants for prompt optimization';
COMMENT ON TABLE hyperparameter_configs IS 'Optimized hyperparameter configurations per model';
COMMENT ON TABLE agent_tasks IS 'Task queue and history for Agent Swarm';
COMMENT ON TABLE neural_mesh_nodes IS 'Registry of all nodes in the Neural Mesh';
COMMENT ON TABLE system_health_snapshots IS 'Periodic snapshots of overall system health';
COMMENT ON TABLE optimization_recommendations IS 'AI-generated recommendations for system improvements';

-- Enable Row Level Security (RLS) where applicable
ALTER TABLE privacy_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_tasks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for privacy_consents (users can only see their own consents)
CREATE POLICY privacy_consents_user_policy ON privacy_consents
  FOR ALL
  USING (auth.uid() = user_id);

-- Grant permissions (adjust based on your auth setup)
GRANT SELECT, INSERT, UPDATE ON privacy_consents TO authenticated;
GRANT SELECT ON privacy_audit_logs TO authenticated;
GRANT SELECT ON model_metrics TO authenticated;
GRANT SELECT ON system_health_snapshots TO authenticated;

-- Trigger to update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_privacy_consents_updated_at BEFORE UPDATE ON privacy_consents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_prompt_performance_updated_at BEFORE UPDATE ON prompt_performance
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_prompt_variants_updated_at BEFORE UPDATE ON prompt_variants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_neural_mesh_nodes_updated_at BEFORE UPDATE ON neural_mesh_nodes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ TiQology AIF database schema created successfully!';
  RAISE NOTICE '📊 Tables created: privacy_consents, privacy_audit_logs, model_metrics, prompt_performance, prompt_variants, hyperparameter_configs, model_recommendations, agent_tasks, neural_mesh_nodes, neural_mesh_messages, system_health_snapshots, optimization_recommendations';
  RAISE NOTICE '🔒 Row Level Security enabled for sensitive tables';
  RAISE NOTICE '⚡ Autonomous Intelligence Fabric database ready!';
END $$;
