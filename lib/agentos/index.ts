/**
 * AgentOS v1.0 - Main Export
 *
 * Centralized exports for all AgentOS functionality
 */

// Pre-built pipelines
export {
  bestInterestEvaluationPipeline,
  devinBuildPipeline,
  ghostEvaluationPipeline,
  multiAgentWorkflow,
  rocketOpsPipeline,
} from "./pipelines";
// Agent registry
export {
  AGENT_REGISTRY,
  canAgentHandleTask,
  findAgentsByDomain,
  findAgentsByKind,
  getAgent,
  getAutomatedAgents,
  getHumanInLoopAgents,
} from "./registry";
// Router
export { routeAgentTask } from "./router";
// Core types
export type {
  AgentDescriptor,
  AgentDomain,
  AgentKind,
  AgentResult,
  AgentTask,
  AgentTrace,
  BestInterestPayload,
  BuildTaskPayload,
  EvaluationPayload,
  OpsTaskPayload,
  TaskPriority,
  TaskStatus,
} from "./types";
export { AgentOSErrorCode } from "./types";
