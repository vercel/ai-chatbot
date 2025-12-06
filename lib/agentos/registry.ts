/**
 * AgentOS v1.0 - Agent Registry
 * Central registry of all available agents in TiQology ecosystem
 */

import type { AgentDescriptor } from './types';

/**
 * Registry of all available agents
 */
export const AGENT_REGISTRY: Record<string, AgentDescriptor> = {
  'ghost-evaluator': {
    id: 'ghost-evaluator',
    name: 'Ghost Evaluator',
    description: 'AI-powered evaluation agent using Claude models for scoring and feedback',
    supportedKinds: ['evaluation'],
    supportedDomains: ['general', 'family-law', 'legal', 'healthcare', 'finance'],
    isHumanInLoop: false,
    endpoint: '/api/ghost',
    capabilities: [
      'Score generation (0-100)',
      'Detailed feedback',
      'Context-aware evaluation',
      'Multi-model support (Haiku, Sonnet)',
      'Fast response (<10s typical)',
    ],
    version: '1.0.0',
  },

  'best-interest-engine': {
    id: 'best-interest-engine',
    name: 'Best Interest Engine',
    description: 'Specialized family law agent for "Best Interest of the Child" evaluations',
    supportedKinds: ['evaluation'],
    supportedDomains: ['family-law', 'legal'],
    isHumanInLoop: false,
    endpoint: '/api/ghost', // Uses Ghost API with specialized prompts
    capabilities: [
      '4-dimensional scoring (Stability, Safety, Cooperation, Emotional Impact)',
      'Overall best interest assessment',
      'Actionable recommendations',
      'Detailed per-dimension analysis',
      'Court-aligned evaluation framework',
      'Neutral, evidence-based analysis',
    ],
    version: '1.0.0',
  },

  'devin-builder': {
    id: 'devin-builder',
    name: 'Devin Builder Agent',
    description: 'Human-in-the-loop development agent that generates Rocket–Devin task templates',
    supportedKinds: ['build', 'workflow'],
    supportedDomains: ['dev-ops', 'general'],
    isHumanInLoop: true,
    capabilities: [
      'Software development task planning',
      'Architecture design',
      'Code implementation guidance',
      'Testing strategy',
      'Documentation generation',
      'Rocket–Devin playbook integration',
    ],
    version: '1.0.0',
  },

  'rocket-ops': {
    id: 'rocket-ops',
    name: 'Rocket Ops Agent',
    description: 'Human-in-the-loop operations agent for deployment and infrastructure management',
    supportedKinds: ['ops', 'workflow'],
    supportedDomains: ['dev-ops'],
    isHumanInLoop: true,
    capabilities: [
      'Deployment automation',
      'Environment configuration',
      'Infrastructure scaling',
      'Monitoring setup',
      'Rollback procedures',
      'Runbook generation',
    ],
    version: '1.0.0',
  },
};

/**
 * Get agent by ID
 */
export function getAgent(agentId: string): AgentDescriptor | null {
  return AGENT_REGISTRY[agentId] || null;
}

/**
 * Find agents by capability
 */
export function findAgentsByKind(kind: string): AgentDescriptor[] {
  return Object.values(AGENT_REGISTRY).filter((agent) =>
    agent.supportedKinds.includes(kind as any)
  );
}

/**
 * Find agents by domain
 */
export function findAgentsByDomain(domain: string): AgentDescriptor[] {
  return Object.values(AGENT_REGISTRY).filter((agent) =>
    agent.supportedDomains.includes(domain as any)
  );
}

/**
 * Check if agent supports task
 */
export function canAgentHandleTask(
  agentId: string,
  kind: string,
  domain: string
): boolean {
  const agent = getAgent(agentId);
  if (!agent) return false;

  return (
    agent.supportedKinds.includes(kind as any) &&
    agent.supportedDomains.includes(domain as any)
  );
}

/**
 * Get all automated agents (non-human-in-loop)
 */
export function getAutomatedAgents(): AgentDescriptor[] {
  return Object.values(AGENT_REGISTRY).filter((agent) => !agent.isHumanInLoop);
}

/**
 * Get all human-in-loop agents
 */
export function getHumanInLoopAgents(): AgentDescriptor[] {
  return Object.values(AGENT_REGISTRY).filter((agent) => agent.isHumanInLoop);
}
