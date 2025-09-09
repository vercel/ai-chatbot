/**
 * Tipos para o sistema de tools e agentes
 */

import { LoadBalancingDecision } from '@/lib/load-balancing/load-balancer';

// Tipos base para tools
export interface ToolParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description: string;
  required?: boolean;
  enum?: string[];
  default?: any;
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, ToolParameter>;
  category: 'calculation' | 'data' | 'communication' | 'analysis' | 'utility';
  version: string;
  timeout?: number;
  cacheable?: boolean;
  costEstimate?: number;
}

export interface ToolExecutionContext {
  provider: LoadBalancingDecision;
  model: string;
  temperature?: number;
  maxTokens?: number;
  userId?: string;
  sessionId?: string;
  metadata?: Record<string, any>;
}

export interface ToolExecutionResult {
  success: boolean;
  data?: any;
  error?: string;
  executionTime: number;
  cost?: number;
  cached?: boolean;
  metadata?: Record<string, any>;
}

export interface ToolCall {
  id: string;
  toolName: string;
  parameters: Record<string, any>;
  context: ToolExecutionContext;
  timestamp: Date;
  result?: ToolExecutionResult;
}

// Tipos para agentes
export interface AgentCapability {
  name: string;
  description: string;
  tools: string[];
  triggers: string[];
  priority: number;
  contextWindow: number;
  maxIterations: number;
}

export interface AgentState {
  id: string;
  name: string;
  capabilities: AgentCapability[];
  activeTools: string[];
  context: Record<string, any>;
  memory: AgentMemory[];
  status: 'idle' | 'active' | 'paused' | 'error';
  lastActivity: Date;
}

export interface AgentMemory {
  id: string;
  type: 'conversation' | 'tool_result' | 'decision' | 'error';
  content: any;
  timestamp: Date;
  importance: number;
  tags: string[];
}

export interface AgentExecutionContext {
  agentId: string;
  userId: string;
  sessionId: string;
  currentPhase?: string;
  availableTools: ToolDefinition[];
  conversationHistory: any[];
  metadata?: Record<string, any>;
}

export interface AgentResponse {
  agentId: string;
  response: any;
  toolCalls?: ToolCall[];
  nextActions?: string[];
  confidence: number;
  executionTime: number;
  metadata?: Record<string, any>;
}

// Tipos para orquestração
export interface OrchestrationRule {
  id: string;
  name: string;
  condition: (context: AgentExecutionContext) => boolean;
  actions: OrchestrationAction[];
  priority: number;
  enabled: boolean;
}

export interface OrchestrationAction {
  type: 'activate_agent' | 'deactivate_agent' | 'switch_context' | 'execute_tool' | 'send_notification';
  target?: string;
  parameters?: Record<string, any>;
  delay?: number;
}

export interface OrchestrationContext {
  sessionId: string;
  activeAgents: string[];
  currentPhase: string;
  rules: OrchestrationRule[];
  state: Record<string, any>;
  lastUpdate: Date;
}

// Tipos para performance
export type HealthStatus = 'healthy' | 'degraded' | 'critical';

export interface PerformanceMetrics {
  agentId: string;
  responseTime: number;
  toolExecutionTime: number;
  totalExecutionTime: number;
  successRate: number;
  errorRate: number;
  cost: number;
  contextUsage: number;
  timestamp: Date;
}

export interface SystemHealth {
  overall: HealthStatus;
  agents: Record<string, HealthStatus>;
  tools: Record<string, HealthStatus>;
  performance: {
    avgResponseTime: number;
    errorRate: number;
    throughput: number;
  };
  lastCheck: Date;
}