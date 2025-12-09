/**
 * AgentOS v1.5 - Memory Service
 * Session-based context retention for stateful agents
 */

import { getTiqologyDb } from '../tiqologyDb';

// ============================================
// TYPES
// ============================================

export type MemoryKind = 'preference' | 'summary' | 'flag' | 'note' | 'fact' | 'decision';

export interface Memory {
  id: string;
  sessionId: string;
  kind: MemoryKind;
  label: string;
  content: string;
  contentJson?: Record<string, any>;
  importance: number; // 1-5
  agentId?: string;
  createdAt: string;
  lastUsedAt: string;
}

export interface Session {
  id: string;
  userId: string | null;
  sessionKey: string;
  domain: string;
  active: boolean;
  lastActivityAt: string;
  createdAt: string;
}

export interface MemoryContext {
  sessionId: string;
  sessionKey: string;
  memories: Memory[];
  summary: string;
  preferencesCount: number;
  flagsCount: number;
}

// ============================================
// SESSION MANAGEMENT
// ============================================

/**
 * Get or create session by session key
 */
export async function getOrCreateSession(
  sessionKey: string,
  userId: string | null = null,
  domain: string = 'general'
): Promise<Session> {
  const supabase = getTiqologyDb();
  
  // Call database function
  const { data, error } = await supabase
    .rpc('get_or_create_session', {
      p_session_key: sessionKey,
      p_user_id: userId,
      p_domain: domain,
    });

  if (error) {
    console.error('[MemoryService] Error getting/creating session:', error);
    throw error;
  }

  return {
    id: data,
    userId,
    sessionKey,
    domain,
    active: true,
    lastActivityAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };
}

/**
 * Get session by session key
 */
export async function getSessionByKey(sessionKey: string): Promise<Session | null> {
  const supabase = getTiqologyDb();
  
  const { data, error } = await supabase
    .from('agent_sessions')
    .select('*')
    .eq('session_key', sessionKey)
    .single();

  if (error || !data) {
    return null;
  }

  return {
    id: data.id,
    userId: data.user_id,
    sessionKey: data.session_key,
    domain: data.domain,
    active: data.active,
    lastActivityAt: data.last_activity_at,
    createdAt: data.created_at,
  };
}

/**
 * Archive a session (mark inactive but keep memories)
 */
export async function archiveSession(sessionId: string): Promise<void> {
  const supabase = getTiqologyDb();
  
  const { error } = await supabase
    .rpc('archive_session', { p_session_id: sessionId });

  if (error) {
    console.error('[MemoryService] Error archiving session:', error);
    throw error;
  }

  console.log(`[MemoryService] Session ${sessionId} archived`);
}

// ============================================
// MEMORY OPERATIONS
// ============================================

/**
 * Load session memories (sorted by importance + recency)
 */
export async function getSessionMemories(
  sessionId: string,
  limit: number = 10,
  minImportance: number = 2
): Promise<Memory[]> {
  const supabase = getTiqologyDb();
  
  const { data, error } = await supabase
    .rpc('get_session_memories', {
      p_session_id: sessionId,
      p_limit: limit,
      p_min_importance: minImportance,
    });

  if (error) {
    console.error('[MemoryService] Error loading memories:', error);
    return [];
  }

  return (data || []).map((m: any) => ({
    id: m.id,
    sessionId: m.session_id,
    kind: m.kind as MemoryKind,
    label: m.label,
    content: m.content,
    contentJson: m.content_json,
    importance: m.importance,
    agentId: m.agent_id,
    createdAt: m.created_at,
    lastUsedAt: m.last_used_at,
  }));
}

/**
 * Add new memory to session
 */
export async function addSessionMemory(
  sessionId: string,
  kind: MemoryKind,
  label: string,
  content: string,
  importance: number = 3,
  agentId?: string,
  contentJson?: Record<string, any>
): Promise<string> {
  const supabase = getTiqologyDb();
  
  const { data, error } = await supabase
    .rpc('add_session_memory', {
      p_session_id: sessionId,
      p_kind: kind,
      p_label: label,
      p_content: content,
      p_importance: importance,
      p_agent_id: agentId,
      p_content_json: contentJson,
    });

  if (error) {
    console.error('[MemoryService] Error adding memory:', error);
    throw error;
  }

  console.log(`[MemoryService] Memory added: ${kind}/${label} (importance=${importance})`);
  return data;
}

/**
 * Update memory importance (e.g., boost when referenced)
 */
export async function updateMemoryImportance(
  memoryId: string,
  newImportance: number
): Promise<void> {
  const supabase = getTiqologyDb();
  
  const { error } = await supabase
    .from('agent_memory_chunks')
    .update({
      importance: Math.max(1, Math.min(5, newImportance)), // Clamp 1-5
      last_used_at: new Date().toISOString(),
    })
    .eq('id', memoryId);

  if (error) {
    console.error('[MemoryService] Error updating memory importance:', error);
  }
}

/**
 * Delete a memory
 */
export async function deleteMemory(memoryId: string): Promise<void> {
  const supabase = getTiqologyDb();
  
  const { error } = await supabase
    .from('agent_memory_chunks')
    .delete()
    .eq('id', memoryId);

  if (error) {
    console.error('[MemoryService] Error deleting memory:', error);
    throw error;
  }
}

// ============================================
// CONTEXT LOADING
// ============================================

/**
 * Load full memory context for a session
 */
export async function loadSessionContext(
  sessionKey: string,
  userId: string | null = null,
  domain: string = 'general'
): Promise<MemoryContext> {
  // Get or create session
  const session = await getOrCreateSession(sessionKey, userId, domain);
  
  // Load memories
  const memories = await getSessionMemories(session.id, 20, 1);
  
  // Count by type
  const preferencesCount = memories.filter(m => m.kind === 'preference').length;
  const flagsCount = memories.filter(m => m.kind === 'flag').length;
  
  // Generate summary
  let summary = 'No prior context.';
  
  if (memories.length > 0) {
    const summaryParts: string[] = [];
    
    if (preferencesCount > 0) {
      summaryParts.push(`${preferencesCount} preference${preferencesCount > 1 ? 's' : ''}`);
    }
    
    if (flagsCount > 0) {
      summaryParts.push(`${flagsCount} flag${flagsCount > 1 ? 's' : ''}`);
    }
    
    const otherCount = memories.length - preferencesCount - flagsCount;
    if (otherCount > 0) {
      summaryParts.push(`${otherCount} other memor${otherCount > 1 ? 'ies' : 'y'}`);
    }
    
    summary = `Session has ${summaryParts.join(', ')}.`;
  }
  
  return {
    sessionId: session.id,
    sessionKey,
    memories,
    summary,
    preferencesCount,
    flagsCount,
  };
}

/**
 * Get formatted context string for agent prompts
 */
export function formatMemoriesForPrompt(memories: Memory[]): string {
  if (memories.length === 0) {
    return '';
  }
  
  const lines: string[] = ['### Session Context'];
  
  // Group by kind
  const byKind: Record<MemoryKind, Memory[]> = {
    preference: [],
    summary: [],
    flag: [],
    note: [],
    fact: [],
    decision: [],
  };
  
  for (const memory of memories) {
    byKind[memory.kind].push(memory);
  }
  
  // Format each kind
  const kindLabels: Record<MemoryKind, string> = {
    preference: 'User Preferences',
    summary: 'Previous Conversations',
    flag: 'Important Flags',
    note: 'Notes',
    fact: 'Known Facts',
    decision: 'Past Decisions',
  };
  
  for (const kind of Object.keys(byKind) as MemoryKind[]) {
    const items = byKind[kind];
    if (items.length === 0) continue;
    
    lines.push(`\n**${kindLabels[kind]}:**`);
    for (const item of items) {
      lines.push(`- ${item.label}: ${item.content}`);
    }
  }
  
  return lines.join('\n');
}

// ============================================
// MEMORY UPDATES FROM AGENT RESPONSES
// ============================================

/**
 * Process agent response for memory updates
 * Agents can request memory saves via memoryUpdates field
 */
export async function processMemoryUpdates(
  sessionId: string,
  agentId: string,
  memoryUpdates: Array<{
    kind: MemoryKind;
    label: string;
    content: string;
    importance?: number;
  }>
): Promise<void> {
  if (!memoryUpdates || memoryUpdates.length === 0) {
    return;
  }
  
  console.log(`[MemoryService] Processing ${memoryUpdates.length} memory updates from ${agentId}`);
  
  for (const update of memoryUpdates) {
    try {
      await addSessionMemory(
        sessionId,
        update.kind,
        update.label,
        update.content,
        update.importance || 3,
        agentId
      );
    } catch (error) {
      console.error('[MemoryService] Error saving memory update:', error);
    }
  }
}

// ============================================
// CLEANUP & MAINTENANCE
// ============================================

/**
 * Cleanup old inactive sessions (90+ days)
 */
export async function cleanupOldSessions(): Promise<number> {
  const supabase = getTiqologyDb();
  
  const { data, error } = await supabase
    .rpc('cleanup_old_sessions');

  if (error) {
    console.error('[MemoryService] Error cleaning up sessions:', error);
    return 0;
  }

  console.log(`[MemoryService] Cleaned up ${data} old sessions`);
  return data;
}

/**
 * Get session statistics
 */
export async function getSessionStats(sessionId: string): Promise<{
  memoryCount: number;
  oldestMemory: string;
  newestMemory: string;
  sessionAge: string;
}> {
  const supabase = getTiqologyDb();
  
  const { data, error } = await supabase
    .rpc('get_session_summary', { p_session_id: sessionId });

  if (error) {
    console.error('[MemoryService] Error getting session stats:', error);
    throw error;
  }

  return data;
}

/**
 * Get memory usage summary across all sessions
 */
export async function getMemoryUsageSummary(): Promise<Array<{
  kind: MemoryKind;
  count: number;
  avgImportance: number;
}>> {
  const supabase = getTiqologyDb();
  
  const { data, error } = await supabase
    .from('memory_usage_by_kind')
    .select('*');

  if (error) {
    console.error('[MemoryService] Error getting memory usage:', error);
    return [];
  }

  return (data || []).map((row: any) => ({
    kind: row.kind as MemoryKind,
    count: row.memory_count,
    avgImportance: row.avg_importance,
  }));
}
