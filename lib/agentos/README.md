# AgentOS v1.5 - Backend Services

This folder contains the core backend services for AgentOS v1.5 - TiQology's global brain for multi-agent orchestration.

---

## Module Overview

### **1. agentRegistry.ts** (290 lines)
**Purpose**: Centralized agent catalog with in-memory caching.

**Key Features**:
- In-memory cache (5-minute TTL)
- 8 seeded agents (legal, sports, finance, build, security, system)
- Cost/latency scoring (1-10 scale)
- Role-based access control (user < pro < lawyer < admin)

**Key Functions**:
```typescript
getAgentById(agentId: string) → Agent | null
getAgentsForDomain(domain: string) → Agent[]
isAgentEnabledForRole(agentId: string, userRole: UserRole) → boolean
getRecommendedAgent(domain, mode, maxCost, maxLatency) → Agent | null
```

**Usage**:
```typescript
import { getAgentById } from '@/lib/agentos/agentRegistry';

const ghost = await getAgentById('ghost-evaluator');
// { id, name, domain, modes, costScore, latencyScore, ... }
```

---

### **2. pipelineExecutor.ts** (500 lines)
**Purpose**: Multi-step agent orchestration with conditional logic.

**Key Features**:
- Sequential step execution
- Conditional branching (if/then/else)
- Context passing between agents
- Execution tracking in database

**Key Functions**:
```typescript
loadPipeline(pipelineId: string) → Pipeline | null
executePipeline(pipelineId, userId, userRole, sessionId, input, memoryContext) → PipelineExecutionResult
getPipelineExecution(executionId: string) → PipelineExecutionResult | null
```

**Example**:
```typescript
import { executePipeline } from '@/lib/agentos/pipelineExecutor';

const result = await executePipeline(
  'best-interest-full-eval',
  'user_123',
  'pro',
  'session_abc',
  { prompt: 'Review contract...' },
  memoryContext
);

// Result:
{
  executionId: 'uuid',
  status: 'success',
  stepsCompleted: 3,
  resultsByStep: [
    { agentId: 'best-interest', result: {...}, durationMs: 1200 },
    { agentId: 'ghost-evaluator', result: {...}, durationMs: 450 },
    // ... conditional step if needed
  ],
  overallSummary: 'Pipeline completed successfully.',
  durationMs: 1850
}
```

**Conditional Logic Example**:
```json
{
  "type": "conditional",
  "if": "ghostCheck.score < 60",
  "then": [
    { "agentId": "trustshield-guard", "mode": "fast" }
  ]
}
```

---

### **3. memoryService.ts** (440 lines)
**Purpose**: Session-based context retention for stateful agents.

**Key Features**:
- 6 memory kinds (preference, summary, flag, note, fact, decision)
- Importance scoring (1-5)
- Automatic session activity tracking
- Memory cleanup (90+ day archival)

**Key Functions**:
```typescript
loadSessionContext(sessionKey, userId, domain) → MemoryContext
addSessionMemory(sessionId, kind, label, content, importance, agentId) → memoryId
formatMemoriesForPrompt(memories: Memory[]) → string
processMemoryUpdates(sessionId, agentId, memoryUpdates[]) → void
```

**Usage**:
```typescript
import { loadSessionContext, addSessionMemory } from '@/lib/agentos/memoryService';

// Load context at start of request
const context = await loadSessionContext('session_abc', 'user_123', 'legal');
// { sessionId, memories: [...], summary, preferencesCount, flagsCount }

// Agent can save new memories
await addSessionMemory(
  context.sessionId,
  'preference',
  'detail-level',
  'prefers detailed explanations',
  4,
  'best-interest'
);
```

**Memory Kinds**:
- `preference`: User preferences (e.g., "prefers detailed explanations")
- `summary`: Conversation summaries (e.g., "Discussed 2 contracts")
- `flag`: Important warnings (e.g., "Safety concern noted")
- `note`: Temporary notes (e.g., "Follow up needed")
- `fact`: Known facts (e.g., "User has 2 children")
- `decision`: Past decisions (e.g., "User rejected Option A")

---

### **4. trustShield.ts** (380 lines)
**Purpose**: Pre-processing security layer for abuse prevention.

**Key Features**:
- Input scanning (SQL injection, XSS, PII, spam, threats)
- Rate limiting (100 req/hour default)
- Role-based permission checks
- Security event logging

**Key Functions**:
```typescript
trustShieldPreProcess(input, userId, sessionKey, agentId, userRole) → SecurityCheckResult
checkInputSecurity(input, userId, agentId, userRole) → SecurityCheckResult
checkRateLimit(userId, sessionKey, maxRequests, windowMinutes) → SecurityCheckResult
getSecurityMetrics(hours) → { totalEvents, blockedRequests, flaggedRequests, ... }
```

**Usage**:
```typescript
import { trustShieldPreProcess } from '@/lib/agentos/trustShield';

const check = await trustShieldPreProcess(
  userInput,
  'user_123',
  'session_abc',
  'ghost-evaluator',
  'user'
);

if (!check.allowed) {
  return { error: check.reason, riskScore: check.riskScore };
}

// Use sanitized input if available
const safeInput = check.sanitizedInput || userInput;
```

**Detected Patterns**:
- SQL injection: `DROP TABLE`, `1=1`, `OR 1=1`
- XSS: `<script>`, `javascript:`
- PII: SSN patterns, credit card numbers
- Spam: Excessive caps, repeated chars
- Threats: Violence keywords

---

## Integration Example

**Complete request flow** (from API endpoint):

```typescript
import { trustShieldPreProcess } from '@/lib/agentos/trustShield';
import { loadSessionContext, processMemoryUpdates } from '@/lib/agentos/memoryService';
import { executePipeline } from '@/lib/agentos/pipelineExecutor';

// 1. Security check
const securityCheck = await trustShieldPreProcess(
  input,
  userId,
  sessionKey,
  pipelineId,
  userRole
);

if (!securityCheck.allowed) {
  return { status: 'blocked', error: securityCheck.reason };
}

// 2. Load memory
const memoryContext = await loadSessionContext(sessionKey, userId, domain);

// 3. Execute pipeline
const result = await executePipeline(
  pipelineId,
  userId,
  userRole,
  memoryContext.sessionId,
  securityCheck.sanitizedInput || input,
  { memories: memoryContext.memories, summary: memoryContext.summary }
);

// 4. Save memories
for (const step of result.resultsByStep) {
  if (step.result?.memoryUpdates) {
    await processMemoryUpdates(
      memoryContext.sessionId,
      step.agentId,
      step.result.memoryUpdates
    );
  }
}

// 5. Return result
return {
  status: result.status,
  executionId: result.executionId,
  resultsByStep: result.resultsByStep,
  summary: result.overallSummary,
  memoryContext,
  durationMs: result.durationMs
};
```

---

## Database Dependencies

These services require the following database objects (from migrations):

### From `003_agentos_v1.5_agent_registry.sql`:
- Table: `tiq_agents`
- Functions: `get_agents_by_domain()`, `is_agent_enabled_for_role()`
- View: `agent_usage_summary`

### From `004_agentos_v1.5_pipeline_engine.sql`:
- Tables: `tiq_pipelines`, `pipeline_executions`
- Functions: `get_pipelines_by_domain()`, `get_pipeline_stats()`
- View: `pipeline_performance_summary`

### From `005_agentos_v1.5_memory_layer.sql`:
- Tables: `agent_sessions`, `agent_memory_chunks`
- Functions: `get_or_create_session()`, `get_session_memories()`, `add_session_memory()`, etc.
- Views: `memory_usage_by_kind`, `active_sessions_summary`

### From `006_agentos_v1.5_telemetry_upgrade.sql`:
- Table: `agentos_event_log` (extended)
- Functions: `get_top_agents()`, `get_system_health_metrics()`, `generate_dashboard_snapshot()`
- Views: `realtime_dashboard_metrics`, `agent_performance_comparison`, etc.

---

## Environment Variables

Required in `.env`:

```bash
# Supabase connection (from lib/tiqologyDb.ts)
TIQ_SUPABASE_URL=https://your-project.supabase.co
TIQ_SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

---

## Testing

### Unit Tests
```bash
npm test lib/agentos/agentRegistry.test.ts
npm test lib/agentos/pipelineExecutor.test.ts
npm test lib/agentos/memoryService.test.ts
npm test lib/agentos/trustShield.test.ts
```

### Integration Tests
```typescript
// Test full pipeline flow
import { executePipeline } from '@/lib/agentos/pipelineExecutor';

const result = await executePipeline(
  'best-interest-full-eval',
  'test_user',
  'pro',
  null,
  { prompt: 'Test contract review' }
);

expect(result.status).toBe('success');
expect(result.stepsCompleted).toBe(3);
```

---

## Performance Characteristics

| Operation | Latency | Notes |
|-----------|---------|-------|
| Agent Registry lookup | < 1ms | In-memory cache |
| Memory load (20 memories) | < 50ms | Database query |
| TrustShield scan | < 10ms | Regex pattern matching |
| Pipeline execution (3 steps) | ~2s | Mostly agent logic |
| Memory save | < 20ms | Database insert |

**Total overhead**: < 100ms (excluding agent execution time)

---

## Error Handling

All functions throw errors with descriptive messages:

```typescript
try {
  const agent = await getAgentById('invalid-agent');
} catch (error) {
  // Error: Agent 'invalid-agent' not found
}

try {
  const result = await executePipeline(...);
} catch (error) {
  // Error: Pipeline execution timeout after 60s
  // Error: Permission denied for agent 'best-interest'
  // Error: Invalid condition syntax in step 2
}
```

**Best practice**: Wrap all AgentOS calls in try/catch blocks.

---

## Monitoring & Debugging

### Enable Debug Logs
```typescript
// Each module logs to console
console.log('[AgentRegistry] Cache refreshed: 8 agents loaded');
console.log('[PipelineExecutor] Executing pipeline: best-interest-full-eval');
console.log('[MemoryService] Loaded 5 memories for session');
console.log('[TrustShield] Input blocked: SQL injection detected');
```

### Query Telemetry
```sql
-- Recent pipeline executions
SELECT * FROM pipeline_executions 
ORDER BY created_at DESC 
LIMIT 10;

-- Security events
SELECT * FROM agentos_event_log 
WHERE agent_id = 'trustshield-guard' 
ORDER BY created_at DESC;

-- Memory usage
SELECT * FROM memory_usage_by_kind;
```

---

## Future Enhancements

### Phase 1.6 (Planned)
- Parallel step execution (reduce latency)
- Agent streaming (SSE for real-time updates)
- Memory embeddings (vector search)

### Phase 1.7 (Planned)
- Custom pipeline builder (UI)
- A/B testing for pipelines
- Cost optimization engine

---

## Contributing

When adding new agents:
1. Insert into `tiq_agents` table
2. Update agent registry cache TTL if needed
3. Add to seeded agents in migration 003

When adding new pipelines:
1. Insert into `tiq_pipelines` table
2. Define steps with proper conditional logic
3. Test with `executePipeline()`

---

## Support

**Documentation**: `docs/AGENTOS_V1_5_PLAN.md`  
**Troubleshooting**: Section 10 in AGENTOS_V1_5_PLAN.md  
**API Reference**: Section 7 in AGENTOS_V1_5_PLAN.md

---

**Version**: 1.5.0  
**Last Updated**: January 2025
