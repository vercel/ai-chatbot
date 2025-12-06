/**
 * AgentOS v1.0 - Pre-built Pipelines
 * Common agent task pipelines for TiQology applications
 */

import type { AgentTask, BestInterestPayload } from './types';
import { routeAgentTask } from './router';

/**
 * Best Interest Evaluation Pipeline
 * 
 * Specialized pipeline for family law "Best Interest of the Child" evaluations
 * Uses Ghost evaluator with Best Interest Engine prompts
 * 
 * @param input - Best Interest evaluation inputs
 * @param options - Additional options
 * @returns AgentResult with 4-dimensional scoring
 */
export async function bestInterestEvaluationPipeline(
  input: {
    parentingPlan: string;
    communication: string;
    incidents: string;
    childProfile: string;
    model?: string;
  },
  options?: {
    origin?: string;
    userId?: string;
    sessionId?: string;
  }
) {
  const task: AgentTask = {
    id: `best-interest_${Date.now()}`,
    origin: options?.origin || 'pipeline',
    targetAgents: ['best-interest-engine'],
    domain: 'family-law',
    kind: 'evaluation',
    priority: 'high',
    payload: {
      parentingPlan: input.parentingPlan,
      communication: input.communication,
      incidents: input.incidents,
      childProfile: input.childProfile,
      model: input.model || 'chat-model',
    },
    metadata: {
      userId: options?.userId,
      sessionId: options?.sessionId,
      pipelineType: 'best-interest-evaluation',
    },
    createdAt: Date.now(),
  };

  return routeAgentTask(task);
}

/**
 * Ghost Evaluation Pipeline
 * 
 * General purpose AI evaluation pipeline
 * 
 * @param prompt - Evaluation prompt
 * @param options - Additional options
 * @returns AgentResult with score and feedback
 */
export async function ghostEvaluationPipeline(
  prompt: string,
  options?: {
    context?: string;
    model?: string;
    origin?: string;
    userId?: string;
  }
) {
  const task: AgentTask = {
    id: `ghost-eval_${Date.now()}`,
    origin: options?.origin || 'pipeline',
    targetAgents: ['ghost-evaluator'],
    domain: 'general',
    kind: 'evaluation',
    priority: 'normal',
    payload: {
      prompt,
      context: options?.context,
      model: options?.model || 'chat-model',
    },
    metadata: {
      userId: options?.userId,
      pipelineType: 'ghost-evaluation',
    },
    createdAt: Date.now(),
  };

  return routeAgentTask(task);
}

/**
 * Devin Build Pipeline
 * 
 * Generate Rocket-Devin build task templates
 * 
 * @param description - Build task description
 * @param requirements - List of requirements
 * @param options - Additional options
 * @returns AgentResult with Rocket-Devin task template
 */
export async function devinBuildPipeline(
  description: string,
  requirements: string[],
  options?: {
    context?: string;
    targetRepo?: string;
    priority?: 'low' | 'medium' | 'high';
    origin?: string;
  }
) {
  const task: AgentTask = {
    id: `devin-build_${Date.now()}`,
    origin: options?.origin || 'pipeline',
    targetAgents: ['devin-builder'],
    domain: 'dev-ops',
    kind: 'build',
    priority: options?.priority === 'high' ? 'high' : 'normal',
    payload: {
      description,
      requirements,
      context: options?.context,
      targetRepo: options?.targetRepo,
      priority: options?.priority,
    },
    metadata: {
      pipelineType: 'devin-build',
    },
    createdAt: Date.now(),
  };

  return routeAgentTask(task);
}

/**
 * Rocket Ops Pipeline
 * 
 * Generate Rocket ops playbooks
 * 
 * @param action - Ops action type
 * @param target - Target system/service
 * @param parameters - Action parameters
 * @param options - Additional options
 * @returns AgentResult with ops playbook
 */
export async function rocketOpsPipeline(
  action: 'deploy' | 'config' | 'monitor' | 'rollback' | 'scale',
  target: string,
  parameters: Record<string, unknown>,
  options?: {
    runbook?: string;
    origin?: string;
  }
) {
  const task: AgentTask = {
    id: `rocket-ops_${Date.now()}`,
    origin: options?.origin || 'pipeline',
    targetAgents: ['rocket-ops'],
    domain: 'dev-ops',
    kind: 'ops',
    priority: action === 'rollback' ? 'critical' : 'high',
    payload: {
      action,
      target,
      parameters,
      runbook: options?.runbook,
    },
    metadata: {
      pipelineType: 'rocket-ops',
    },
    createdAt: Date.now(),
  };

  return routeAgentTask(task);
}

/**
 * Multi-Agent Workflow Pipeline
 * 
 * Execute a sequence of agent tasks
 * 
 * @param tasks - Array of agent tasks
 * @returns Array of agent results
 */
export async function multiAgentWorkflow(tasks: AgentTask[]) {
  const results = [];

  for (const task of tasks) {
    const result = await routeAgentTask(task);
    results.push(result);

    // Stop workflow if any task fails
    if (result.status === 'failed') {
      break;
    }
  }

  return results;
}
