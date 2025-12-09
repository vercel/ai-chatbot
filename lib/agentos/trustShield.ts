/**
 * AgentOS v1.5 - TrustShield Security Hook
 * Pre-processing security layer for abuse prevention
 */

import { getTiqologyDb } from '../tiqologyDb';
import { isAgentEnabledForRole, type UserRole } from './agentRegistry';

// ============================================
// TYPES
// ============================================

export interface SecurityCheckResult {
  allowed: boolean;
  reason?: string;
  riskScore: number; // 0-100
  flags: string[];
  sanitizedInput?: string;
}

export interface AbusePattern {
  id: string;
  pattern: string;
  category: 'profanity' | 'pii' | 'injection' | 'spam' | 'threat' | 'other';
  severity: 'low' | 'medium' | 'high';
  action: 'warn' | 'block' | 'sanitize';
}

// ============================================
// ABUSE DETECTION PATTERNS
// ============================================

const ABUSE_PATTERNS: AbusePattern[] = [
  // SQL Injection attempts
  {
    id: 'sql-injection-1',
    pattern: /(\bDROP\s+TABLE\b|\bDELETE\s+FROM\b|\bINSERT\s+INTO\b)/i,
    category: 'injection',
    severity: 'high',
    action: 'block',
  },
  {
    id: 'sql-injection-2',
    pattern: /(--|\b1=1\b|\bOR\s+1=1\b)/i,
    category: 'injection',
    severity: 'high',
    action: 'block',
  },
  
  // XSS attempts
  {
    id: 'xss-1',
    pattern: /<script[^>]*>.*?<\/script>/gi,
    category: 'injection',
    severity: 'high',
    action: 'sanitize',
  },
  {
    id: 'xss-2',
    pattern: /javascript:/gi,
    category: 'injection',
    severity: 'medium',
    action: 'sanitize',
  },
  
  // PII patterns (basic)
  {
    id: 'ssn',
    pattern: /\b\d{3}-\d{2}-\d{4}\b/,
    category: 'pii',
    severity: 'medium',
    action: 'warn',
  },
  {
    id: 'credit-card',
    pattern: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/,
    category: 'pii',
    severity: 'high',
    action: 'warn',
  },
  
  // Spam/flood detection
  {
    id: 'excessive-caps',
    pattern: /([A-Z]{10,})/,
    category: 'spam',
    severity: 'low',
    action: 'warn',
  },
  {
    id: 'repeated-chars',
    pattern: /(.)\1{10,}/,
    category: 'spam',
    severity: 'low',
    action: 'sanitize',
  },
  
  // Threat detection
  {
    id: 'threat-keywords',
    pattern: /\b(kill|murder|bomb|terrorist|attack)\b/i,
    category: 'threat',
    severity: 'high',
    action: 'block',
  },
];

// ============================================
// SECURITY CHECKS
// ============================================

/**
 * Scan input text for abuse patterns
 */
function scanForAbusePatterns(input: string): {
  matches: AbusePattern[];
  riskScore: number;
} {
  const matches: AbusePattern[] = [];
  let riskScore = 0;
  
  for (const pattern of ABUSE_PATTERNS) {
    if (pattern.pattern.test(input)) {
      matches.push(pattern);
      
      // Add to risk score based on severity
      if (pattern.severity === 'high') riskScore += 40;
      else if (pattern.severity === 'medium') riskScore += 20;
      else riskScore += 10;
    }
  }
  
  return { matches, riskScore: Math.min(100, riskScore) };
}

/**
 * Sanitize input by removing/replacing dangerous patterns
 */
function sanitizeInput(input: string, matches: AbusePattern[]): string {
  let sanitized = input;
  
  for (const match of matches) {
    if (match.action === 'sanitize') {
      sanitized = sanitized.replace(match.pattern, '[REMOVED]');
    }
  }
  
  return sanitized;
}

/**
 * Check if user has permission to access an agent
 */
export async function checkAgentPermission(
  agentId: string,
  userRole: UserRole
): Promise<SecurityCheckResult> {
  const hasPermission = await isAgentEnabledForRole(agentId, userRole);
  
  if (!hasPermission) {
    return {
      allowed: false,
      reason: `User role '${userRole}' does not have permission to access agent '${agentId}'`,
      riskScore: 0,
      flags: ['permission_denied'],
    };
  }
  
  return {
    allowed: true,
    riskScore: 0,
    flags: [],
  };
}

/**
 * Main security check for user input
 */
export async function checkInputSecurity(
  input: string,
  userId: string | null = null,
  agentId?: string,
  userRole: UserRole = 'user'
): Promise<SecurityCheckResult> {
  const flags: string[] = [];
  
  // 1. Check input length (prevent DoS)
  if (input.length > 50000) {
    return {
      allowed: false,
      reason: 'Input too long (max 50,000 characters)',
      riskScore: 100,
      flags: ['input_too_long'],
    };
  }
  
  // 2. Scan for abuse patterns
  const { matches, riskScore } = scanForAbusePatterns(input);
  
  // 3. Check if any high-severity blocks
  const shouldBlock = matches.some(m => m.severity === 'high' && m.action === 'block');
  
  if (shouldBlock) {
    // Log security event
    await logSecurityEvent({
      userId,
      agentId,
      eventType: 'input_blocked',
      riskScore,
      details: {
        matches: matches.map(m => ({ id: m.id, category: m.category })),
        inputLength: input.length,
      },
    });
    
    return {
      allowed: false,
      reason: 'Input contains prohibited content',
      riskScore,
      flags: matches.map(m => m.category),
    };
  }
  
  // 4. Sanitize if needed
  const sanitized = sanitizeInput(input, matches);
  
  // 5. Add warnings for medium-severity patterns
  for (const match of matches) {
    if (match.severity === 'medium' || match.severity === 'low') {
      flags.push(match.category);
    }
  }
  
  // 6. Log if any flags detected
  if (flags.length > 0) {
    await logSecurityEvent({
      userId,
      agentId,
      eventType: 'input_flagged',
      riskScore,
      details: {
        flags,
        sanitized: sanitized !== input,
      },
    });
  }
  
  return {
    allowed: true,
    riskScore,
    flags,
    sanitizedInput: sanitized !== input ? sanitized : undefined,
  };
}

/**
 * Rate limiting check (basic implementation)
 */
export async function checkRateLimit(
  userId: string | null,
  sessionKey: string,
  maxRequests: number = 100,
  windowMinutes: number = 60
): Promise<SecurityCheckResult> {
  const supabase = getTiqologyDb();
  
  try {
    const windowStart = new Date(Date.now() - windowMinutes * 60 * 1000).toISOString();
    
    // Count recent requests
    const { count, error } = await supabase
      .from('agentos_event_log')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', windowStart);

    if (error) {
      console.error('[TrustShield] Error checking rate limit:', error);
      // Allow on error (fail open for availability)
      return {
        allowed: true,
        riskScore: 0,
        flags: [],
      };
    }

    const requestCount = count || 0;
    
    if (requestCount >= maxRequests) {
      await logSecurityEvent({
        userId,
        eventType: 'rate_limit_exceeded',
        riskScore: 80,
        details: {
          requestCount,
          maxRequests,
          windowMinutes,
        },
      });
      
      return {
        allowed: false,
        reason: `Rate limit exceeded: ${requestCount}/${maxRequests} requests in ${windowMinutes} minutes`,
        riskScore: 80,
        flags: ['rate_limit'],
      };
    }
    
    return {
      allowed: true,
      riskScore: 0,
      flags: [],
    };
  } catch (error) {
    console.error('[TrustShield] Error in rate limit check:', error);
    // Fail open
    return {
      allowed: true,
      riskScore: 0,
      flags: [],
    };
  }
}

/**
 * Combined pre-processing hook
 */
export async function trustShieldPreProcess(
  input: string,
  userId: string | null,
  sessionKey: string,
  agentId: string,
  userRole: UserRole = 'user'
): Promise<SecurityCheckResult> {
  // 1. Check agent permission
  const permissionCheck = await checkAgentPermission(agentId, userRole);
  if (!permissionCheck.allowed) {
    return permissionCheck;
  }
  
  // 2. Check rate limit
  const rateLimitCheck = await checkRateLimit(userId, sessionKey);
  if (!rateLimitCheck.allowed) {
    return rateLimitCheck;
  }
  
  // 3. Check input security
  const securityCheck = await checkInputSecurity(input, userId, agentId, userRole);
  if (!securityCheck.allowed) {
    return securityCheck;
  }
  
  // All checks passed
  return {
    allowed: true,
    riskScore: securityCheck.riskScore,
    flags: securityCheck.flags,
    sanitizedInput: securityCheck.sanitizedInput,
  };
}

// ============================================
// SECURITY EVENT LOGGING
// ============================================

/**
 * Log security event to database
 */
async function logSecurityEvent(event: {
  userId: string | null;
  agentId?: string;
  eventType: string;
  riskScore: number;
  details: Record<string, any>;
}): Promise<void> {
  const supabase = getTiqologyDb();
  
  try {
    const { error } = await supabase
      .from('agentos_event_log')
      .insert({
        user_id: event.userId,
        agent_id: event.agentId || 'trustshield-guard',
        event_type: event.eventType,
        score: event.riskScore,
        status: 'error',
        metadata: event.details,
      });

    if (error) {
      console.error('[TrustShield] Error logging security event:', error);
    }
  } catch (error) {
    console.error('[TrustShield] Failed to log security event:', error);
  }
}

/**
 * Get recent security events for a user
 */
export async function getUserSecurityEvents(
  userId: string,
  limit: number = 50
): Promise<Array<{
  eventType: string;
  riskScore: number;
  timestamp: string;
  details: Record<string, any>;
}>> {
  const supabase = getTiqologyDb();
  
  const { data, error } = await supabase
    .from('agentos_event_log')
    .select('event_type, score, created_at, metadata')
    .eq('user_id', userId)
    .eq('agent_id', 'trustshield-guard')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[TrustShield] Error fetching security events:', error);
    return [];
  }

  return (data || []).map((row: any) => ({
    eventType: row.event_type,
    riskScore: row.score || 0,
    timestamp: row.created_at,
    details: row.metadata || {},
  }));
}

/**
 * Get system-wide security metrics
 */
export async function getSecurityMetrics(hours: number = 24): Promise<{
  totalEvents: number;
  blockedRequests: number;
  flaggedRequests: number;
  avgRiskScore: number;
  topCategories: Array<{ category: string; count: number }>;
}> {
  const supabase = getTiqologyDb();
  
  const windowStart = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
  
  const { data, error } = await supabase
    .from('agentos_event_log')
    .select('event_type, score, metadata')
    .eq('agent_id', 'trustshield-guard')
    .gte('created_at', windowStart);

  if (error) {
    console.error('[TrustShield] Error fetching security metrics:', error);
    return {
      totalEvents: 0,
      blockedRequests: 0,
      flaggedRequests: 0,
      avgRiskScore: 0,
      topCategories: [],
    };
  }

  const events = data || [];
  const totalEvents = events.length;
  const blockedRequests = events.filter((e: any) => e.event_type === 'input_blocked').length;
  const flaggedRequests = events.filter((e: any) => e.event_type === 'input_flagged').length;
  const avgRiskScore = events.reduce((sum: number, e: any) => sum + (e.score || 0), 0) / (totalEvents || 1);
  
  // Count categories
  const categoryCounts: Record<string, number> = {};
  for (const event of events) {
    const flags = event.metadata?.flags || [];
    for (const flag of flags) {
      categoryCounts[flag] = (categoryCounts[flag] || 0) + 1;
    }
  }
  
  const topCategories = Object.entries(categoryCounts)
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return {
    totalEvents,
    blockedRequests,
    flaggedRequests,
    avgRiskScore: Math.round(avgRiskScore),
    topCategories,
  };
}
