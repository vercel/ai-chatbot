/**
 * AgentOS v1.5 - Agent Registry Service
 * Global agent registry with caching and permission checks
 */

import { getTiqologyDb } from '../tiqologyDb';

// ============================================
// TYPES
// ============================================

export interface Agent {
  id: string;
  name: string;
  domain: 'legal' | 'sports' | 'finance' | 'build' | 'travel' | 'security' | 'system';
  description: string;
  modes: ('fast' | 'deep' | 'batch')[];
  costScore: number; // 1-10
  latencyScore: number; // 1-10
  riskLevel: 'low' | 'medium' | 'high';
  enabled: boolean;
  minRole: 'user' | 'pro' | 'lawyer' | 'admin';
  endpointUrl?: string;
  metadata: Record<string, any>;
}

export type UserRole = 'user' | 'pro' | 'lawyer' | 'admin';

// ============================================
// IN-MEMORY CACHE
// ============================================

let agentCache: Map<string, Agent> = new Map();
let cacheLastRefreshed: Date | null = null;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// ============================================
// CORE FUNCTIONS
// ============================================

/**
 * Refresh agent cache from database
 */
export async function refreshAgentCache(): Promise<void> {
  const supabase = getTiqologyDb();
  
  try {
    const { data: agents, error } = await supabase
      .from('tiq_agents')
      .select('*')
      .eq('enabled', true);

    if (error) {
      console.error('[AgentRegistry] Error refreshing cache:', error);
      throw error;
    }

    // Clear and rebuild cache
    agentCache.clear();
    
    for (const agent of agents || []) {
      agentCache.set(agent.id, {
        id: agent.id,
        name: agent.name,
        domain: agent.domain,
        description: agent.description,
        modes: agent.modes as ('fast' | 'deep' | 'batch')[],
        costScore: agent.cost_score,
        latencyScore: agent.latency_score,
        riskLevel: agent.risk_level as 'low' | 'medium' | 'high',
        enabled: agent.enabled,
        minRole: agent.min_role as UserRole,
        endpointUrl: agent.endpoint_url,
        metadata: agent.metadata || {},
      });
    }

    cacheLastRefreshed = new Date();
    console.log(`[AgentRegistry] Cache refreshed: ${agentCache.size} agents loaded`);
  } catch (error) {
    console.error('[AgentRegistry] Fatal error refreshing cache:', error);
    throw error;
  }
}

/**
 * Ensure cache is fresh (refresh if stale)
 */
async function ensureFreshCache(): Promise<void> {
  const now = Date.now();
  const cacheAge = cacheLastRefreshed 
    ? now - cacheLastRefreshed.getTime()
    : Infinity;

  if (cacheAge > CACHE_TTL_MS) {
    await refreshAgentCache();
  }
}

/**
 * Get agent by ID
 */
export async function getAgentById(agentId: string): Promise<Agent | null> {
  await ensureFreshCache();
  return agentCache.get(agentId) || null;
}

/**
 * Get all agents for a domain
 */
export async function getAgentsForDomain(
  domain: Agent['domain']
): Promise<Agent[]> {
  await ensureFreshCache();
  
  const agents: Agent[] = [];
  for (const agent of agentCache.values()) {
    if (agent.domain === domain) {
      agents.push(agent);
    }
  }
  
  // Sort by cost (cheapest first), then latency (fastest first)
  return agents.sort((a, b) => {
    if (a.costScore !== b.costScore) {
      return a.costScore - b.costScore;
    }
    return a.latencyScore - b.latencyScore;
  });
}

/**
 * Check if agent is enabled for a user role
 */
export async function isAgentEnabledForRole(
  agentId: string,
  userRole: UserRole
): Promise<boolean> {
  const agent = await getAgentById(agentId);
  
  if (!agent || !agent.enabled) {
    return false;
  }
  
  // Role hierarchy: user < pro < lawyer < admin
  const roleHierarchy: Record<UserRole, number> = {
    user: 1,
    pro: 2,
    lawyer: 3,
    admin: 4,
  };
  
  const userLevel = roleHierarchy[userRole] || 0;
  const requiredLevel = roleHierarchy[agent.minRole] || 5;
  
  return userLevel >= requiredLevel;
}

/**
 * Check if agent supports a specific mode
 */
export async function agentSupportsMode(
  agentId: string,
  mode: 'fast' | 'deep' | 'batch'
): Promise<boolean> {
  const agent = await getAgentById(agentId);
  
  if (!agent) {
    return false;
  }
  
  return agent.modes.includes(mode);
}

/**
 * Get recommended agent for a task
 */
export async function getRecommendedAgent(
  domain: Agent['domain'],
  mode: 'fast' | 'deep' | 'batch' = 'fast',
  maxCost: number = 10,
  maxLatency: number = 10
): Promise<Agent | null> {
  const agents = await getAgentsForDomain(domain);
  
  // Filter by mode support and constraints
  const candidates = agents.filter(agent => 
    agent.modes.includes(mode) &&
    agent.costScore <= maxCost &&
    agent.latencyScore <= maxLatency
  );
  
  if (candidates.length === 0) {
    return null;
  }
  
  // Return cheapest + fastest
  return candidates[0];
}

/**
 * Get all enabled agents
 */
export async function getAllAgents(): Promise<Agent[]> {
  await ensureFreshCache();
  return Array.from(agentCache.values());
}

/**
 * Get agents by risk level
 */
export async function getAgentsByRiskLevel(
  riskLevel: 'low' | 'medium' | 'high'
): Promise<Agent[]> {
  await ensureFreshCache();
  
  return Array.from(agentCache.values())
    .filter(agent => agent.riskLevel === riskLevel);
}

/**
 * Validate agent exists and is enabled
 */
export async function validateAgent(agentId: string): Promise<{
  valid: boolean;
  agent?: Agent;
  reason?: string;
}> {
  const agent = await getAgentById(agentId);
  
  if (!agent) {
    return {
      valid: false,
      reason: `Agent '${agentId}' not found in registry`,
    };
  }
  
  if (!agent.enabled) {
    return {
      valid: false,
      agent,
      reason: `Agent '${agentId}' is disabled`,
    };
  }
  
  return {
    valid: true,
    agent,
  };
}

/**
 * Get agent statistics
 */
export async function getAgentStats(): Promise<{
  totalAgents: number;
  enabledAgents: number;
  agentsByDomain: Record<string, number>;
  agentsByRiskLevel: Record<string, number>;
}> {
  await ensureFreshCache();
  
  const agents = Array.from(agentCache.values());
  
  const agentsByDomain: Record<string, number> = {};
  const agentsByRiskLevel: Record<string, number> = {};
  
  for (const agent of agents) {
    // Count by domain
    agentsByDomain[agent.domain] = (agentsByDomain[agent.domain] || 0) + 1;
    
    // Count by risk level
    agentsByRiskLevel[agent.riskLevel] = (agentsByRiskLevel[agent.riskLevel] || 0) + 1;
  }
  
  return {
    totalAgents: agents.length,
    enabledAgents: agents.filter(a => a.enabled).length,
    agentsByDomain,
    agentsByRiskLevel,
  };
}

// ============================================
// INITIALIZATION
// ============================================

/**
 * Initialize agent registry (call on server startup)
 */
export async function initializeAgentRegistry(): Promise<void> {
  console.log('[AgentRegistry] Initializing...');
  await refreshAgentCache();
  
  const stats = await getAgentStats();
  console.log('[AgentRegistry] Initialized with:', stats);
}

// Auto-initialize on import (for serverless environments)
if (typeof window === 'undefined') {
  initializeAgentRegistry().catch(error => {
    console.error('[AgentRegistry] Failed to initialize:', error);
  });
}
