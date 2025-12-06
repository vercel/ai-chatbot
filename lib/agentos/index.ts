/**
 * AgentOS v1.0 - Main Export
 * 
 * Centralized exports for all AgentOS functionality
 */

// Core types
export type {
  AgentTask,
  AgentDescriptor,
  AgentResult,
  AgentTrace,
  AgentKind,
  AgentDomain,
  TaskStatus,
  TaskPriority,
  EvaluationPayload,
  BestInterestPayload,
  BuildTaskPayload,
  OpsTaskPayload,
} from './types';

export { AgentOSErrorCode } from './types';

// Agent registry
export {
  AGENT_REGISTRY,
  getAgent,
  findAgentsByKind,
  findAgentsByDomain,
  canAgentHandleTask,
  getAutomatedAgents,
  getHumanInLoopAgents,
} from './registry';

// Router
export { routeAgentTask } from './router';

// Pre-built pipelines
export {
  bestInterestEvaluationPipeline,
  ghostEvaluationPipeline,
  devinBuildPipeline,
  rocketOpsPipeline,
  multiAgentWorkflow,
} from './pipelines';
