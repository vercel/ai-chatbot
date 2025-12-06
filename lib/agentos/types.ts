/**
 * AgentOS v1.0 - Core Type Definitions
 * Multi-agent orchestration layer for TiQology
 */

export type AgentKind = 
  | 'evaluation'     // AI evaluation tasks (Ghost, Best Interest)
  | 'build'          // Development/build tasks (Devin)
  | 'ops'            // Operations/deployment tasks (Rocket)
  | 'analysis'       // Data analysis tasks
  | 'workflow';      // Multi-step workflow orchestration

export type AgentDomain = 
  | 'family-law'     // Family law evaluation domain
  | 'general'        // General purpose domain
  | 'dev-ops'        // Development & operations
  | 'legal'          // General legal domain
  | 'healthcare'     // Healthcare domain
  | 'finance';       // Financial domain

export type TaskStatus = 
  | 'pending'        // Task created, not started
  | 'routing'        // Being routed to agent
  | 'processing'     // Agent is processing
  | 'completed'      // Successfully completed
  | 'failed'         // Failed with error
  | 'timeout';       // Timed out

export type TaskPriority = 'low' | 'normal' | 'high' | 'critical';

/**
 * Core agent task definition
 */
export interface AgentTask {
  id: string;                          // Unique task identifier
  origin: string;                      // Origin app/service (e.g., "tiqology-spa", "ai-chatbot")
  targetAgents: string[];              // Agent IDs to handle this task
  domain: AgentDomain;                 // Task domain
  kind: AgentKind;                     // Task type
  priority: TaskPriority;              // Execution priority
  payload: Record<string, unknown>;    // Task-specific data
  metadata?: {                         // Optional metadata
    userId?: string;
    sessionId?: string;
    tags?: string[];
    [key: string]: unknown;
  };
  createdAt: number;                   // Unix timestamp
  timeout?: number;                    // Timeout in milliseconds
}

/**
 * Agent descriptor for registry
 */
export interface AgentDescriptor {
  id: string;                          // Unique agent ID
  name: string;                        // Human-readable name
  description: string;                 // Agent purpose
  supportedKinds: AgentKind[];         // Supported task kinds
  supportedDomains: AgentDomain[];     // Supported domains
  isHumanInLoop: boolean;              // Requires human interaction
  endpoint?: string;                   // API endpoint (if automated)
  capabilities: string[];              // Agent capabilities
  version: string;                     // Agent version
}

/**
 * Agent execution result
 */
export interface AgentResult {
  taskId: string;                      // Original task ID
  agentId: string;                     // Agent that processed
  status: TaskStatus;                  // Final status
  result?: {                           // Success result
    data: Record<string, unknown>;
    summary?: string;
    confidence?: number;               // 0-1 confidence score
  };
  error?: {                            // Error details
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  trace: AgentTrace;                   // Execution trace
  completedAt: number;                 // Unix timestamp
}

/**
 * Execution trace for debugging and monitoring
 */
export interface AgentTrace {
  steps: Array<{
    timestamp: number;
    agent: string;
    action: string;
    duration?: number;                 // Milliseconds
    metadata?: Record<string, unknown>;
  }>;
  totalDuration: number;               // Total execution time (ms)
  intermediateResults?: Record<string, unknown>;
}

/**
 * Error codes for AgentOS
 */
export enum AgentOSErrorCode {
  VALIDATION_ERROR = 'AGENTOS_VALIDATION_ERROR',
  ROUTING_ERROR = 'AGENTOS_ROUTING_ERROR',
  AGENT_NOT_FOUND = 'AGENTOS_AGENT_NOT_FOUND',
  EXECUTION_ERROR = 'AGENTOS_EXECUTION_ERROR',
  TIMEOUT_ERROR = 'AGENTOS_TIMEOUT_ERROR',
  AUTHENTICATION_ERROR = 'AGENTOS_AUTHENTICATION_ERROR',
  RATE_LIMIT_ERROR = 'AGENTOS_RATE_LIMIT_ERROR',
}

/**
 * Evaluation-specific payload types
 */
export interface EvaluationPayload {
  prompt: string;
  context?: string;
  model?: string;
  options?: Record<string, unknown>;
}

/**
 * Best Interest evaluation payload
 */
export interface BestInterestPayload extends EvaluationPayload {
  parentingPlan: string;
  communication: string;
  incidents: string;
  childProfile: string;
}

/**
 * Build task payload
 */
export interface BuildTaskPayload {
  description: string;
  requirements: string[];
  context?: string;
  targetRepo?: string;
  priority?: 'low' | 'medium' | 'high';
}

/**
 * Ops task payload
 */
export interface OpsTaskPayload {
  action: 'deploy' | 'config' | 'monitor' | 'rollback' | 'scale';
  target: string;
  parameters: Record<string, unknown>;
  runbook?: string;
}
