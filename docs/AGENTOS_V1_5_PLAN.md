# AgentOS v1.5 - Global Brain Implementation Plan

**Status:** ✅ Database + Backend COMPLETE  
**Branch:** `feature/agentos-v1.5-global-brain`  
**Version:** 1.5.0  
**Date:** January 2025

---

## Executive Summary

AgentOS v1.5 transforms the TiQology agent orchestration system into a **global brain** for all products and modules. This upgrade enables:

1. **Agent Registry**: Centralized catalog of 8+ specialized agents with cost/latency scoring
2. **Pipeline Engine**: Multi-step workflows with conditional logic (e.g., "run Ghost → if score < 60, escalate to TrustShield")
3. **Memory Layer**: Session-based context retention across conversations
4. **Enhanced Telemetry**: Real-time analytics dashboard with performance metrics
5. **TrustShield Hook**: Pre-processing security layer for abuse prevention

**TiQology SPA Integration**: Simple REST API to execute pipelines by ID, pass session keys for memory, and receive structured results + telemetry.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     TiQology SPA / Mobile                    │
│                  (React, Flutter, External APIs)             │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼ POST /api/agentos-v1.5
┌─────────────────────────────────────────────────────────────┐
│                  AgentOS v1.5 Router                         │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ 1. TrustShield Pre-Check (abuse, rate limit, perms)  │   │
│  └─────────────────┬────────────────────────────────────┘   │
│                    ▼                                         │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ 2. Memory Layer (load session context)               │   │
│  └─────────────────┬────────────────────────────────────┘   │
│                    ▼                                         │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ 3. Pipeline Executor                                  │   │
│  │    - Load pipeline definition (tiq_pipelines)        │   │
│  │    - Execute steps sequentially                       │   │
│  │    - Handle conditionals (if/then/else)              │   │
│  │    - Pass context between agents                      │   │
│  └─────────────────┬────────────────────────────────────┘   │
│                    ▼                                         │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ 4. Agent Registry (resolve agentId → handler)        │   │
│  └─────────────────┬────────────────────────────────────┘   │
│                    ▼                                         │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ 5. Agent Execution (call actual agent logic)         │   │
│  └─────────────────┬────────────────────────────────────┘   │
│                    ▼                                         │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ 6. Memory Updates (save new preferences/flags)       │   │
│  └─────────────────┬────────────────────────────────────┘   │
│                    ▼                                         │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ 7. Telemetry Logging (agentos_event_log)            │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              Supabase PostgreSQL Database                    │
│  • tiq_agents (registry)                                    │
│  • tiq_pipelines (workflow definitions)                     │
│  • pipeline_executions (results)                            │
│  • agent_sessions (session tracking)                        │
│  • agent_memory_chunks (context storage)                    │
│  • agentos_event_log (telemetry)                            │
└─────────────────────────────────────────────────────────────┘
```

---

## 1. Agent Registry

### Database: `tiq_agents`

**Purpose**: Centralized catalog of all TiQology agents with metadata for smart routing.

**Schema**:
```sql
CREATE TABLE tiq_agents (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  domain TEXT NOT NULL, -- 'legal', 'sports', 'finance', 'build', 'travel', 'security', 'system'
  description TEXT,
  modes JSONB NOT NULL, -- ['fast', 'deep', 'batch']
  cost_score INTEGER CHECK (cost_score >= 1 AND cost_score <= 10),
  latency_score INTEGER CHECK (latency_score >= 1 AND latency_score <= 10),
  risk_level TEXT CHECK (risk_level IN ('low', 'medium', 'high')),
  enabled BOOLEAN DEFAULT true,
  min_role TEXT DEFAULT 'user', -- 'user', 'pro', 'lawyer', 'admin'
  endpoint_url TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**Seeded Agents**:
| ID | Name | Domain | Modes | Cost | Latency | Min Role |
|----|------|--------|-------|------|---------|----------|
| `ghost-evaluator` | Ghost (Speed) | legal | fast, deep | 5 | 6 | user |
| `best-interest` | Best Interest Engine | legal | deep | 8 | 9 | pro |
| `devin-builder` | Devin AI Builder | system | deep, batch | 7 | 8 | lawyer |
| `rocket-ops` | Rocket Ops | system | fast, batch | 3 | 4 | user |
| `future-build-lab` | Future Build Lab | build | fast, deep | 9 | 7 | user |
| `fanops-trip` | FanOps Trip Planner | sports | fast | 4 | 5 | user |
| `survey-hunter` | Survey Hunter | finance | fast, batch | 2 | 3 | user |
| `trustshield-guard` | TrustShield Guard | security | fast | 6 | 2 | admin |

**Backend Service**: `lib/agentos/agentRegistry.ts`

**Key Functions**:
```typescript
// Load agents with in-memory caching (5-minute TTL)
await refreshAgentCache();

// Get agent by ID
const agent = await getAgentById('ghost-evaluator');

// Get agents for domain
const legalAgents = await getAgentsForDomain('legal');

// Check permission (role hierarchy: user < pro < lawyer < admin)
const canAccess = await isAgentEnabledForRole('best-interest', 'pro'); // true

// Get recommended agent (smart selection by cost + latency)
const recommended = await getRecommendedAgent('legal', 'fast', maxCost=5, maxLatency=7);
// → Returns 'ghost-evaluator' (cost=5, latency=6)
```

**Analytics View**: `agent_usage_summary` (30-day metrics)

---

## 2. Pipeline Engine

### Database: `tiq_pipelines`, `pipeline_executions`

**Purpose**: Define multi-step agent workflows with conditional logic.

**Schema**:
```sql
CREATE TABLE tiq_pipelines (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  steps JSONB NOT NULL, -- Array of PipelineStep
  enabled BOOLEAN DEFAULT true,
  min_role TEXT DEFAULT 'user',
  version INTEGER DEFAULT 1,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE pipeline_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_id TEXT REFERENCES tiq_pipelines(id),
  user_id TEXT,
  session_id UUID,
  status TEXT CHECK (status IN ('running', 'success', 'error', 'timeout', 'cancelled')),
  steps_completed INTEGER DEFAULT 0,
  total_steps INTEGER,
  results_by_step JSONB, -- Array of StepResult
  overall_summary TEXT,
  duration_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);
```

**Step Types**:

1. **Sequential Agent Step**:
   ```json
   {
     "agentId": "ghost-evaluator",
     "mode": "fast",
     "input": { "prompt": "Review contract..." },
     "saveAs": "ghostCheck"
   }
   ```

2. **Conditional Step**:
   ```json
   {
     "type": "conditional",
     "if": "ghostCheck.score < 60",
     "then": [
       { "agentId": "trustshield-guard", "mode": "fast" }
     ],
     "else": [
       { "agentId": "best-interest", "mode": "deep" }
     ]
   }
   ```

**Seeded Pipelines**:

### Pipeline #1: `best-interest-full-eval`
**3-agent workflow with conditional escalation**

```json
{
  "id": "best-interest-full-eval",
  "name": "Best Interest Full Evaluation",
  "steps": [
    {
      "agentId": "best-interest",
      "mode": "deep",
      "saveAs": "bestInterest"
    },
    {
      "agentId": "ghost-evaluator",
      "mode": "fast",
      "saveAs": "ghostCheck"
    },
    {
      "type": "conditional",
      "if": "ghostCheck.score < 60",
      "then": [
        {
          "agentId": "trustshield-guard",
          "mode": "fast",
          "input": { "flagReason": "Low Ghost score requires security review" }
        }
      ]
    }
  ]
}
```

**Flow**:
1. Best Interest Engine (deep analysis)
2. Ghost Evaluator (fast compliance check)
3. **IF** Ghost score < 60 **THEN** TrustShield (security review)

**Use Case**: Legal contract evaluation with automatic escalation for risky documents.

---

### Pipeline #2: `quick-legal-assessment`
**Single-agent fast mode**

```json
{
  "id": "quick-legal-assessment",
  "name": "Quick Legal Assessment",
  "steps": [
    {
      "agentId": "ghost-evaluator",
      "mode": "fast"
    }
  ]
}
```

**Use Case**: Rapid legal scan for consumer users.

---

### Pipeline #3: `fanops-full-planning`
**Multi-domain parallel execution**

```json
{
  "id": "fanops-full-planning",
  "name": "FanOps Full Planning",
  "steps": [
    {
      "agentId": "fanops-trip",
      "mode": "fast",
      "saveAs": "tripPlan"
    },
    {
      "agentId": "survey-hunter",
      "mode": "fast",
      "input": { "searchQuery": "sports event deals" },
      "saveAs": "deals"
    }
  ]
}
```

**Use Case**: Sports event trip planning + deal hunting.

---

### Pipeline #4: `security-threat-analysis`
**Conditional threat escalation**

```json
{
  "id": "security-threat-analysis",
  "name": "Security Threat Analysis",
  "steps": [
    {
      "agentId": "trustshield-guard",
      "mode": "fast",
      "saveAs": "securityCheck"
    },
    {
      "type": "conditional",
      "if": "securityCheck.threatLevel >= 70",
      "then": [
        {
          "agentId": "rocket-ops",
          "mode": "fast",
          "input": { "escalate": true }
        }
      ]
    }
  ]
}
```

**Use Case**: Security threat detection with automatic ops escalation.

---

**Backend Service**: `lib/agentos/pipelineExecutor.ts`

**Key Functions**:
```typescript
// Execute pipeline
const result = await executePipeline(
  pipelineId: 'best-interest-full-eval',
  userId: 'user_123',
  userRole: 'pro',
  sessionId: 'session_abc',
  input: { prompt: 'Review this contract...' },
  memoryContext: { memories: [...], summary: '...' }
);

// Result structure
{
  executionId: 'uuid',
  pipelineId: 'best-interest-full-eval',
  status: 'success',
  stepsCompleted: 3,
  totalSteps: 3,
  resultsByStep: [
    {
      stepIndex: 0,
      agentId: 'best-interest',
      mode: 'deep',
      status: 'success',
      result: { score: 85, summary: '...' },
      durationMs: 1200
    },
    // ... more steps
  ],
  overallSummary: 'Pipeline completed successfully.',
  durationMs: 3450,
  startedAt: '2025-01-15T10:00:00Z',
  completedAt: '2025-01-15T10:00:03Z'
}
```

**Analytics**:
- `get_pipelines_by_domain(domain)` → Returns enabled pipelines for domain
- `get_pipeline_stats(pipeline_id)` → 30-day execution metrics
- View: `pipeline_performance_summary` (success rate, avg duration)

---

## 3. Memory Layer

### Database: `agent_sessions`, `agent_memory_chunks`

**Purpose**: Persistent session context across multiple agent calls.

**Schema**:
```sql
CREATE TABLE agent_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT,
  session_key TEXT UNIQUE NOT NULL,
  domain TEXT DEFAULT 'general',
  active BOOLEAN DEFAULT true,
  last_activity_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE agent_memory_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES agent_sessions(id) ON DELETE CASCADE,
  kind TEXT CHECK (kind IN ('preference', 'summary', 'flag', 'note', 'fact', 'decision')),
  label TEXT NOT NULL,
  content TEXT NOT NULL,
  content_json JSONB,
  importance INTEGER CHECK (importance >= 1 AND importance <= 5) DEFAULT 3,
  agent_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  last_used_at TIMESTAMPTZ DEFAULT now()
);
```

**Memory Kinds**:
| Kind | Description | Example |
|------|-------------|---------|
| `preference` | User preferences | "prefers detailed explanations" |
| `summary` | Conversation summaries | "Discussed 2 contracts, both approved" |
| `flag` | Important warnings | "User has safety concerns about clause 4" |
| `note` | Temporary notes | "Follow up needed on pricing" |
| `fact` | Known facts | "User has 2 children, ages 5 and 8" |
| `decision` | Past decisions | "User rejected Option A due to cost" |

**Backend Service**: `lib/agentos/memoryService.ts`

**Key Functions**:
```typescript
// Get or create session
const session = await getOrCreateSession('session_abc', 'user_123', 'legal');

// Load session context
const context = await loadSessionContext('session_abc', 'user_123', 'legal');
// Returns:
{
  sessionId: 'uuid',
  sessionKey: 'session_abc',
  memories: [
    { kind: 'preference', label: 'detail-level', content: 'prefers detailed explanations', importance: 4 },
    { kind: 'fact', label: 'family', content: '2 children, ages 5 and 8', importance: 3 },
    // ... more memories
  ],
  summary: 'Session has 2 preferences, 1 flag, 3 other memories.',
  preferencesCount: 2,
  flagsCount: 1
}

// Add new memory
await addSessionMemory(
  sessionId: 'uuid',
  kind: 'flag',
  label: 'safety-concern',
  content: 'User concerned about liability clause',
  importance: 5,
  agentId: 'best-interest'
);

// Format memories for agent prompts
const promptContext = formatMemoriesForPrompt(context.memories);
// Returns markdown string:
/**
 * ### Session Context
 * 
 * **User Preferences:**
 * - detail-level: prefers detailed explanations
 * 
 * **Important Flags:**
 * - safety-concern: User concerned about liability clause
 * 
 * **Known Facts:**
 * - family: 2 children, ages 5 and 8
 */
```

**Cleanup**:
- `cleanup_old_sessions()` → Deletes inactive sessions > 90 days
- `archive_session(session_id)` → Mark inactive but keep memories

**Analytics**:
- View: `memory_usage_by_kind` (count + avg importance per kind)
- View: `active_sessions_summary` (active count, memory count)

---

## 4. Enhanced Telemetry

### Database: Extended `agentos_event_log`

**New Columns**:
```sql
ALTER TABLE agentos_event_log ADD COLUMN pipeline_id TEXT;
ALTER TABLE agentos_event_log ADD COLUMN pipeline_execution_id UUID;
ALTER TABLE agentos_event_log ADD COLUMN app_id TEXT DEFAULT 'tiqology-spa';
ALTER TABLE agentos_event_log ADD COLUMN score INTEGER CHECK (score >= 0 AND score <= 100);
ALTER TABLE agentos_event_log ADD COLUMN duration_ms INTEGER;
ALTER TABLE agentos_event_log ADD COLUMN status TEXT;
```

**Analytics Functions**:

### 1. `get_top_agents(limit, days)`
Returns top agents by usage with success rate + avg duration.

**Example**:
```sql
SELECT * FROM get_top_agents(10, 30);
```

**Result**:
| agent_id | total_executions | success_rate | avg_duration_ms |
|----------|------------------|--------------|-----------------|
| ghost-evaluator | 1250 | 0.97 | 450 |
| best-interest | 890 | 0.95 | 1200 |
| fanops-trip | 560 | 0.99 | 320 |

---

### 2. `get_top_pipelines(limit, days)`
Returns top pipelines by execution count.

---

### 3. `get_system_health_metrics(hours)`
Overall system health snapshot.

**Example**:
```sql
SELECT * FROM get_system_health_metrics(24);
```

**Result**:
```json
{
  "totalRequests": 5420,
  "successCount": 5180,
  "errorCount": 180,
  "timeoutCount": 60,
  "successRate": 0.956,
  "p95ResponseTime": 1850
}
```

---

### 4. `get_hourly_request_volume(hours)`
Hourly breakdown for charts.

---

### 5. `generate_dashboard_snapshot()`
**Complete JSON snapshot for TiQology SPA dashboard**.

**Example**:
```sql
SELECT generate_dashboard_snapshot();
```

**Result**:
```json
{
  "timestamp": "2025-01-15T10:00:00Z",
  "realtime": {
    "requestsLastHour": 145,
    "avgResponseTimeMs": 680,
    "successRate": 0.97,
    "activeErrors": 4
  },
  "topAgents": [
    { "agentId": "ghost-evaluator", "executions": 1250, "successRate": 0.97 },
    // ... top 10
  ],
  "topPipelines": [
    { "pipelineId": "best-interest-full-eval", "executions": 420 },
    // ... top 10
  ],
  "systemHealth": {
    "totalRequests": 5420,
    "successCount": 5180,
    // ...
  },
  "appBreakdown": [
    { "appId": "tiqology-spa", "requests": 3200, "avgDuration": 650 },
    { "appId": "mobile", "requests": 1800, "avgDuration": 720 },
    // ...
  ],
  "recentErrors": [
    { "agentId": "best-interest", "errorMessage": "Timeout after 60s", "count": 12 },
    // ... top 5
  ]
}
```

**Analytics Views**:
- `realtime_dashboard_metrics` (last 1 hour stats)
- `agent_performance_comparison` (predicted vs actual latency/cost)
- `app_usage_breakdown` (by app_id: tiqology-spa, mobile, api)
- `error_analysis` (top errors by agent, last 7 days)

---

## 5. TrustShield Security Hook

### Purpose
Pre-processing security layer to prevent:
- SQL injection
- XSS attacks
- PII leakage (SSN, credit cards)
- Spam/flooding
- Threats
- Unauthorized agent access

**Backend Service**: `lib/agentos/trustShield.ts`

**Security Checks**:

### 1. **Input Security Scan**
Scans text for abuse patterns (SQL injection, XSS, PII, spam, threats).

**Example**:
```typescript
const check = await checkInputSecurity(
  input: "DROP TABLE users; --",
  userId: 'user_123',
  agentId: 'ghost-evaluator',
  userRole: 'user'
);

// Result:
{
  allowed: false,
  reason: 'Input contains prohibited content',
  riskScore: 40,
  flags: ['injection']
}
```

### 2. **Rate Limiting**
Prevents abuse by limiting requests per time window.

**Default**: 100 requests per 60 minutes.

**Example**:
```typescript
const check = await checkRateLimit('user_123', 'session_abc');

// Result (if exceeded):
{
  allowed: false,
  reason: 'Rate limit exceeded: 105/100 requests in 60 minutes',
  riskScore: 80,
  flags: ['rate_limit']
}
```

### 3. **Agent Permission Check**
Enforces role hierarchy: `user < pro < lawyer < admin`.

**Example**:
```typescript
const check = await checkAgentPermission('best-interest', 'user');

// Result:
{
  allowed: false,
  reason: "User role 'user' does not have permission to access agent 'best-interest'",
  flags: ['permission_denied']
}
```

### 4. **Combined Pre-Process Hook**
Single function that runs all checks.

**Example**:
```typescript
const result = await trustShieldPreProcess(
  input: "Review this contract...",
  userId: 'user_123',
  sessionKey: 'session_abc',
  agentId: 'best-interest',
  userRole: 'pro'
);

// Result (all checks passed):
{
  allowed: true,
  riskScore: 0,
  flags: [],
  sanitizedInput: undefined // No sanitization needed
}
```

**Security Event Logging**:
All blocked/flagged requests are logged to `agentos_event_log` with:
- `agent_id = 'trustshield-guard'`
- `event_type = 'input_blocked' | 'input_flagged' | 'rate_limit_exceeded'`
- `score = riskScore`
- `metadata = { flags, matches, details }`

**Analytics**:
```typescript
// Get user security history
const events = await getUserSecurityEvents('user_123', limit=50);

// Get system-wide security metrics
const metrics = await getSecurityMetrics(hours=24);
// Returns:
{
  totalEvents: 340,
  blockedRequests: 25,
  flaggedRequests: 80,
  avgRiskScore: 22,
  topCategories: [
    { category: 'spam', count: 45 },
    { category: 'pii', count: 20 },
    // ...
  ]
}
```

---

## API Reference for TiQology SPA

### Endpoint: `POST /api/agentos-v1.5`

**Purpose**: Execute a pipeline or single agent with memory + security.

**Request Body**:
```typescript
{
  // REQUIRED: Pipeline OR Agent
  pipelineId?: string; // 'best-interest-full-eval', 'quick-legal-assessment', etc.
  agentId?: string;    // 'ghost-evaluator', 'best-interest', etc.
  mode?: 'fast' | 'deep' | 'batch'; // Only if using agentId
  
  // REQUIRED: Input
  input: string | Record<string, any>; // Prompt or structured data
  
  // User Context
  userId?: string | null;
  userRole?: 'user' | 'pro' | 'lawyer' | 'admin'; // Default: 'user'
  sessionKey?: string; // For memory persistence
  
  // Memory
  loadMemory?: boolean; // Default: true
  saveMemory?: boolean; // Default: true
  
  // Metadata
  domain?: string; // 'legal', 'sports', etc.
  appId?: string;  // 'tiqology-spa', 'mobile', 'api'
}
```

**Example Request (Pipeline)**:
```bash
curl -X POST https://tiqology.com/api/agentos-v1.5 \
  -H "Content-Type: application/json" \
  -d '{
    "pipelineId": "best-interest-full-eval",
    "userId": "user_123",
    "userRole": "pro",
    "sessionKey": "session_abc",
    "input": {
      "prompt": "Review this employment contract...",
      "documentUrl": "https://..."
    },
    "loadMemory": true,
    "saveMemory": true,
    "domain": "legal",
    "appId": "tiqology-spa"
  }'
```

**Response (Success)**:
```json
{
  "status": "success",
  "executionId": "uuid",
  "pipelineId": "best-interest-full-eval",
  "resultsByStep": [
    {
      "stepIndex": 0,
      "agentId": "best-interest",
      "mode": "deep",
      "status": "success",
      "result": {
        "score": 85,
        "summary": "Contract is favorable with minor concerns in termination clause.",
        "memoryUpdates": [
          {
            "kind": "preference",
            "label": "detail-level",
            "content": "prefers detailed explanations",
            "importance": 4
          }
        ]
      },
      "durationMs": 1200
    },
    {
      "stepIndex": 1,
      "agentId": "ghost-evaluator",
      "mode": "fast",
      "status": "success",
      "result": {
        "score": 72,
        "summary": "Compliance check passed."
      },
      "durationMs": 450
    },
    {
      "stepIndex": 2,
      "agentId": "trustshield-guard",
      "mode": "fast",
      "status": "success",
      "result": {
        "threatLevel": 15,
        "summary": "No security concerns detected."
      },
      "durationMs": 200
    }
  ],
  "summary": "Pipeline 'Best Interest Full Evaluation' completed successfully. 3 steps executed.",
  "memoryContext": {
    "sessionId": "uuid",
    "sessionKey": "session_abc",
    "memories": [
      {
        "kind": "preference",
        "label": "detail-level",
        "content": "prefers detailed explanations",
        "importance": 4
      }
    ],
    "summary": "Session has 1 preference."
  },
  "telemetryId": "uuid",
  "durationMs": 1850
}
```

**Response (Blocked by TrustShield)**:
```json
{
  "status": "blocked",
  "securityCheck": {
    "allowed": false,
    "reason": "Input contains prohibited content",
    "riskScore": 40,
    "flags": ["injection"]
  },
  "error": {
    "code": "AGENTOS_SECURITY_BLOCKED",
    "message": "Input contains prohibited content",
    "details": { "flags": ["injection"] }
  }
}
```

**Response (Agent Not Found)**:
```json
{
  "status": "error",
  "error": {
    "code": "AGENTOS_AGENT_NOT_FOUND",
    "message": "Agent 'invalid-agent' not found"
  }
}
```

---

### Endpoint: `GET /api/agentos-v1.5?executionId=<id>`

**Purpose**: Retrieve pipeline execution result.

**Example**:
```bash
curl https://tiqology.com/api/agentos-v1.5?executionId=uuid
```

**Response**:
```json
{
  "execution": {
    "executionId": "uuid",
    "pipelineId": "best-interest-full-eval",
    "status": "success",
    "stepsCompleted": 3,
    "totalSteps": 3,
    "resultsByStep": [...],
    "overallSummary": "...",
    "durationMs": 1850,
    "startedAt": "2025-01-15T10:00:00Z",
    "completedAt": "2025-01-15T10:00:02Z"
  }
}
```

---

### Endpoint: `GET /api/agentos-v1.5`

**Purpose**: Service health check + agent/pipeline list.

**Example**:
```bash
curl https://tiqology.com/api/agentos-v1.5
```

**Response**:
```json
{
  "status": "healthy",
  "service": "agentos-v1.5",
  "version": "1.5.0",
  "description": "Multi-agent orchestration with pipelines, memory, and security",
  "features": [
    "Agent Registry: 8 specialized agents",
    "Pipeline Engine: Multi-step orchestration with conditionals",
    "Memory Layer: Session-based context retention",
    "Telemetry: Real-time analytics and monitoring",
    "TrustShield: Pre-processing security layer"
  ],
  "agents": [
    {
      "id": "ghost-evaluator",
      "name": "Ghost (Speed)",
      "domain": "legal",
      "modes": ["fast", "deep"],
      "costScore": 5,
      "latencyScore": 6,
      "minRole": "user"
    },
    // ... all 8 agents
  ],
  "stats": {
    "totalAgents": 8,
    "domains": ["legal", "sports", "finance", "build", "travel", "security", "system"]
  }
}
```

---

## Migration Guide (v1.0 → v1.5)

### Database Migrations

Run these SQL files in Supabase:

```bash
# 1. Agent Registry
psql -f docs/migrations/003_agentos_v1.5_agent_registry.sql

# 2. Pipeline Engine
psql -f docs/migrations/004_agentos_v1.5_pipeline_engine.sql

# 3. Memory Layer
psql -f docs/migrations/005_agentos_v1.5_memory_layer.sql

# 4. Telemetry Upgrade
psql -f docs/migrations/006_agentos_v1.5_telemetry_upgrade.sql
```

### Code Updates

**Old (v1.0)**:
```typescript
// app/api/agent-router/route.ts
const result = await routeAgentTask(task);
```

**New (v1.5)**:
```typescript
// Use new endpoint: app/api/agentos-v1.5/route.ts
const result = await executePipeline(
  pipelineId: 'best-interest-full-eval',
  userId: 'user_123',
  userRole: 'pro',
  sessionId: 'session_abc',
  input: { prompt: '...' }
);
```

### TiQology SPA Integration

**Replace**:
```typescript
// Old v1.0 call
const response = await fetch('/api/agent-router', {
  method: 'POST',
  body: JSON.stringify({ task: {...} })
});
```

**With**:
```typescript
// New v1.5 call
const response = await fetch('/api/agentos-v1.5', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    pipelineId: 'best-interest-full-eval',
    userId: currentUser.id,
    userRole: currentUser.role,
    sessionKey: currentSession.key,
    input: { prompt: userInput },
    loadMemory: true,
    saveMemory: true,
    domain: 'legal',
    appId: 'tiqology-spa'
  })
});

const data = await response.json();

if (data.status === 'success') {
  // Display results
  console.log('Pipeline completed:', data.summary);
  console.log('Results by step:', data.resultsByStep);
  
  // Show memory context
  if (data.memoryContext) {
    console.log('Session memories:', data.memoryContext.memories);
  }
  
  // Track telemetry
  analytics.track('pipeline_executed', {
    pipelineId: data.pipelineId,
    executionId: data.executionId,
    durationMs: data.durationMs
  });
  
} else if (data.status === 'blocked') {
  // Security block
  alert('Request blocked by security check: ' + data.error.message);
  
} else {
  // Error
  console.error('Pipeline error:', data.error);
}
```

---

## Testing Guide

### 1. Test Agent Registry

```typescript
import { getAgentById, getAgentsForDomain, getRecommendedAgent } from '@/lib/agentos/agentRegistry';

// Test 1: Load agent
const ghost = await getAgentById('ghost-evaluator');
console.assert(ghost?.name === 'Ghost (Speed)');

// Test 2: Get agents by domain
const legalAgents = await getAgentsForDomain('legal');
console.assert(legalAgents.length >= 2); // ghost + best-interest

// Test 3: Get recommended agent
const recommended = await getRecommendedAgent('legal', 'fast', 5, 7);
console.assert(recommended?.id === 'ghost-evaluator');
```

### 2. Test Pipeline Execution

```typescript
import { executePipeline } from '@/lib/agentos/pipelineExecutor';

const result = await executePipeline(
  'best-interest-full-eval',
  'user_123',
  'pro',
  null,
  { prompt: 'Test contract review' }
);

console.assert(result.status === 'success');
console.assert(result.stepsCompleted === 3);
console.assert(result.resultsByStep.length === 3);
```

### 3. Test Memory Layer

```typescript
import { loadSessionContext, addSessionMemory } from '@/lib/agentos/memoryService';

// Load context
const context = await loadSessionContext('test_session', 'user_123', 'legal');
console.log('Memories loaded:', context.memories.length);

// Add memory
await addSessionMemory(
  context.sessionId,
  'preference',
  'detail-level',
  'prefers detailed explanations',
  4,
  'best-interest'
);

// Reload to verify
const updated = await loadSessionContext('test_session', 'user_123', 'legal');
console.assert(updated.memories.length === context.memories.length + 1);
```

### 4. Test TrustShield

```typescript
import { trustShieldPreProcess } from '@/lib/agentos/trustShield';

// Test 1: Safe input
const safe = await trustShieldPreProcess(
  'Review this contract',
  'user_123',
  'session_abc',
  'ghost-evaluator',
  'user'
);
console.assert(safe.allowed === true);

// Test 2: Blocked input (SQL injection)
const blocked = await trustShieldPreProcess(
  'DROP TABLE users; --',
  'user_123',
  'session_abc',
  'ghost-evaluator',
  'user'
);
console.assert(blocked.allowed === false);
console.assert(blocked.flags.includes('injection'));
```

### 5. Test API Endpoint

```bash
# Test pipeline execution
curl -X POST http://localhost:3000/api/agentos-v1.5 \
  -H "Content-Type: application/json" \
  -d '{
    "pipelineId": "quick-legal-assessment",
    "userId": "test_user",
    "userRole": "user",
    "sessionKey": "test_session",
    "input": { "prompt": "Test prompt" }
  }'

# Expected: 200 OK with execution result

# Test security block
curl -X POST http://localhost:3000/api/agentos-v1.5 \
  -H "Content-Type: application/json" \
  -d '{
    "pipelineId": "quick-legal-assessment",
    "input": "DROP TABLE users; --"
  }'

# Expected: 403 Forbidden with security error
```

---

## Performance Benchmarks

### Agent Registry
- **Cache TTL**: 5 minutes
- **Refresh Time**: < 50ms (8 agents)
- **Lookup Time**: < 1ms (in-memory)

### Pipeline Execution
- **Sequential (3 agents)**: ~1.8s (depends on agent latency)
- **Conditional Overhead**: < 10ms per condition
- **Context Passing**: < 5ms per step

### Memory Layer
- **Session Load**: < 50ms (20 memories)
- **Memory Save**: < 20ms per memory
- **Context Formatting**: < 5ms

### TrustShield
- **Input Scan**: < 10ms (per 1KB text)
- **Rate Limit Check**: < 30ms (DB query)
- **Combined Pre-Process**: < 50ms

### Overall API Latency
- **Pipeline (3 steps)**: ~2.0s (mostly agent execution)
- **Single Agent**: ~500ms (depends on agent)
- **Overhead (router + security + memory)**: < 100ms

---

## Future Roadmap

### Phase 1.6 (Q1 2025)
- **Parallel Step Execution**: Run non-dependent steps in parallel
- **Agent Streaming**: Real-time step updates via SSE
- **Memory Embeddings**: Vector search for semantic memory retrieval

### Phase 1.7 (Q2 2025)
- **Custom Pipelines**: User-defined workflows via UI
- **A/B Testing**: Compare pipeline variants
- **Cost Optimization**: Auto-select cheapest agents

### Phase 2.0 (Q3 2025)
- **Multi-Modal Agents**: Image, audio, video inputs
- **Agent Marketplace**: Third-party agent integration
- **Global Memory**: Cross-user knowledge graph

---

## Support & Troubleshooting

### Common Issues

**1. Agent not found**
```
Error: Agent 'invalid-agent' not found
```
**Solution**: Check `tiq_agents` table. Run `SELECT id FROM tiq_agents;` to see available agents.

---

**2. Pipeline execution timeout**
```
Error: Pipeline execution timeout after 60s
```
**Solution**: 
- Reduce pipeline complexity (fewer steps)
- Use faster modes ('fast' instead of 'deep')
- Check agent latency scores in `tiq_agents`

---

**3. Memory not persisting**
```
Memories not appearing in subsequent calls
```
**Solution**:
- Verify `saveMemory: true` in request
- Check `agent_sessions` table: `SELECT * FROM agent_sessions WHERE session_key = 'your_key';`
- Verify agents are returning `memoryUpdates` in results

---

**4. Security blocking valid input**
```
Request blocked: Input contains prohibited content
```
**Solution**:
- Check TrustShield patterns in `lib/agentos/trustShield.ts`
- Review `agentos_event_log` for blocked events: `SELECT * FROM agentos_event_log WHERE event_type = 'input_blocked';`
- Adjust abuse patterns if false positive

---

**5. Rate limit exceeded**
```
Rate limit exceeded: 105/100 requests in 60 minutes
```
**Solution**:
- Implement exponential backoff
- Upgrade user to higher tier with increased limits
- Contact admin to adjust limits in `trustShield.ts`

---

## Contact

**AgentOS Team**: agentos@tiqology.com  
**Documentation**: https://docs.tiqology.com/agentos-v1.5  
**GitHub**: https://github.com/tiqology/ai-chatbot  

---

**End of AgentOS v1.5 Documentation**  
**Version**: 1.5.0  
**Last Updated**: January 2025
