# TiQology Core DB Integration

## Overview

AgentOS v1.0 now automatically logs all Ghost and Best Interest evaluations to the **TiQology Core Database** (Supabase). This enables cross-application analytics, audit trails, and historical evaluation tracking.

---

## Architecture

### Database Tables

AgentOS writes to three tables in the `public` schema:

#### 1. `evaluations`

Main evaluation records table.

```sql
CREATE TABLE public.evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id TEXT NOT NULL,
  case_id TEXT,
  evaluator_user_id TEXT,
  evaluation_type TEXT NOT NULL, -- 'ghost' | 'best_interest'
  model_flavor TEXT NOT NULL,    -- 'fast' | 'deep'
  overall_score INTEGER NOT NULL,
  summary TEXT,
  raw_request JSONB,
  raw_response JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 2. `evaluation_dimension_scores`

Dimensional scores for Best Interest evaluations.

```sql
CREATE TABLE public.evaluation_dimension_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_id UUID NOT NULL REFERENCES evaluations(id) ON DELETE CASCADE,
  dimension_name TEXT NOT NULL, -- 'Stability', 'Emotional', 'Safety', 'Development'
  score INTEGER NOT NULL,
  reasoning TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 3. `agentos_event_log`

AgentOS execution event log.

```sql
CREATE TABLE public.agentos_event_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,      -- 'evaluation_run' | 'agent_task' | 'pipeline_execution'
  agent_id TEXT NOT NULL,
  task_id TEXT NOT NULL,
  org_id TEXT,
  case_id TEXT,
  user_id TEXT,
  status TEXT NOT NULL,          -- 'started' | 'completed' | 'failed'
  metadata JSONB,
  error_details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Environment Variables

Required environment variables in `.env.local`:

```bash
# TiQology Core Database (Supabase)
TIQ_SUPABASE_URL=https://your-project.supabase.co
TIQ_SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**Security:**
- Use **service role key** (not anon key) for server-side access
- Never expose service role key in client code
- Store in environment variables only

---

## How It Works

### Automatic Logging Flow

1. **Client sends evaluation request** to `/api/agent-router`
2. **AgentOS routes** to Ghost or Best Interest agent
3. **Agent executes** evaluation
4. **Before returning result**, agent calls:
   - `logEvaluation()` - Writes to `evaluations` + `evaluation_dimension_scores`
   - `logAgentOSEvent()` - Writes to `agentos_event_log`
5. **Response includes** `evaluationId` and optional `loggingError`

### Error Handling

If database logging fails:
- ✅ API response still returns successfully
- ❌ `loggingError` field added to response
- 📝 Error logged to console for debugging

**Example response with logging error:**

```json
{
  "taskId": "eval_12345",
  "status": "completed",
  "result": {
    "data": { "score": 85, "feedback": "..." },
    "evaluationId": null
  },
  "loggingError": "Evaluation insert failed: Connection timeout"
}
```

---

## API Reference

### `logEvaluation()`

Log an evaluation result to the database.

**Function signature:**

```typescript
function logEvaluation(input: EvaluationLogInput): Promise<LogEvaluationResult>
```

**Input type:**

```typescript
interface EvaluationLogInput {
  orgId: string;                    // Organization ID (required)
  caseId?: string;                  // Case ID (optional)
  evaluatorUserId?: string;         // User who requested eval (optional)
  evaluationType: 'ghost' | 'best_interest';
  modelFlavor: 'fast' | 'deep';     // 'fast' = chat-model, 'deep' = chat-model-reasoning
  overallScore: number;             // 0-100
  summary?: string;                 // Human-readable summary
  dimensions?: DimensionScore[];    // Best Interest dimensions
  rawRequest?: Record<string, any>; // Full AgentTask
  rawResponse?: Record<string, any>; // Full agent response
}

interface DimensionScore {
  dimensionName: string;            // e.g., 'Stability', 'Emotional'
  score: number;                    // 0-100
  reasoning?: string;               // Why this score
}
```

**Return type:**

```typescript
interface LogEvaluationResult {
  evaluationId?: string;  // UUID of created evaluation
  loggingError?: string;  // Error message if insert failed
}
```

---

### `logAgentOSEvent()`

Log an AgentOS execution event.

**Function signature:**

```typescript
function logAgentOSEvent(input: AgentOSEventInput): Promise<LogEvaluationResult>
```

**Input type:**

```typescript
interface AgentOSEventInput {
  eventType: 'evaluation_run' | 'agent_task' | 'pipeline_execution';
  agentId: string;           // e.g., 'ghost-evaluator'
  taskId: string;            // AgentTask ID
  orgId?: string;
  caseId?: string;
  userId?: string;
  status: 'started' | 'completed' | 'failed';
  metadata?: Record<string, any>;
  errorDetails?: Record<string, any>;
}
```

---

### `extractEvaluationMetadata()`

Helper to extract org/case/user IDs from AgentTask metadata.

```typescript
function extractEvaluationMetadata(task: AgentTask): {
  orgId?: string;
  caseId?: string;
  userId?: string;
}
```

**Usage:**

```typescript
const { orgId, caseId, userId } = extractEvaluationMetadata(task);
```

Looks for:
- `task.metadata.orgId` or `task.metadata.organizationId`
- `task.metadata.caseId`
- `task.metadata.userId` or `task.metadata.requestedBy`

---

## Example Payloads

### Ghost Evaluation

**Request:**

```json
{
  "task": {
    "id": "eval_1733500000",
    "origin": "tiqology-spa",
    "targetAgents": ["ghost-evaluator"],
    "domain": "general",
    "kind": "evaluation",
    "payload": {
      "evaluationPrompt": "Evaluate email quality",
      "content": "Dear Sir, I need help ASAP.",
      "model": "chat-model"
    },
    "metadata": {
      "orgId": "org_abc123",
      "userId": "user_xyz789"
    }
  }
}
```

**Logged to `evaluations`:**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "org_id": "org_abc123",
  "case_id": null,
  "evaluator_user_id": "user_xyz789",
  "evaluation_type": "ghost",
  "model_flavor": "fast",
  "overall_score": 35,
  "summary": "Email lacks professional structure...",
  "raw_request": { "task": {...}, "payload": {...} },
  "raw_response": { "score": 35, "feedback": "...", "result": "..." },
  "created_at": "2025-12-06T10:00:00Z"
}
```

**Logged to `agentos_event_log`:**

```json
{
  "event_type": "evaluation_run",
  "agent_id": "ghost-evaluator",
  "task_id": "eval_1733500000",
  "org_id": "org_abc123",
  "user_id": "user_xyz789",
  "status": "completed",
  "metadata": { "score": 35, "model": "chat-model" }
}
```

---

### Best Interest Evaluation

**Request:**

```json
{
  "task": {
    "id": "bi_eval_1733500000",
    "origin": "tiqology-spa",
    "targetAgents": ["best-interest-engine"],
    "domain": "family-law",
    "kind": "evaluation",
    "payload": {
      "caseContext": "Custody dispute for 7-year-old",
      "evaluationFocus": "primary-custody",
      "parentAInfo": { "name": "Mother", ... },
      "parentBInfo": { "name": "Father", ... },
      "childInfo": { "age": 7, ... },
      "model": "chat-model-reasoning"
    },
    "metadata": {
      "orgId": "org_abc123",
      "caseId": "FL-2025-00123",
      "userId": "attorney_001"
    }
  }
}
```

**Logged to `evaluations`:**

```json
{
  "id": "660e8400-e29b-41d4-a716-446655440000",
  "org_id": "org_abc123",
  "case_id": "FL-2025-00123",
  "evaluator_user_id": "attorney_001",
  "evaluation_type": "best_interest",
  "model_flavor": "deep",
  "overall_score": 82,
  "summary": "Overall: 82/100",
  "raw_request": { "task": {...}, "payload": {...} },
  "raw_response": { "ghostResult": {...}, "scores": {...} }
}
```

**Logged to `evaluation_dimension_scores`:**

```json
[
  {
    "evaluation_id": "660e8400-e29b-41d4-a716-446655440000",
    "dimension_name": "Stability",
    "score": 75,
    "reasoning": "Both parents have stable housing and employment..."
  },
  {
    "dimension_name": "Emotional",
    "score": 85,
    "reasoning": "Strong emotional bond with mother, positive relationship with father..."
  },
  {
    "dimension_name": "Safety",
    "score": 90,
    "reasoning": "No safety concerns identified for either parent..."
  },
  {
    "dimension_name": "Development",
    "score": 80,
    "reasoning": "Both parents support child's education and extracurricular activities..."
  }
]
```

**Logged to `agentos_event_log`:**

```json
{
  "event_type": "evaluation_run",
  "agent_id": "best-interest-engine",
  "task_id": "bi_eval_1733500000",
  "org_id": "org_abc123",
  "case_id": "FL-2025-00123",
  "user_id": "attorney_001",
  "status": "completed",
  "metadata": { "overallScore": 82, "model": "chat-model-reasoning" }
}
```

---

## Metadata Requirements

For proper logging, include these fields in `task.metadata`:

### Required
- `orgId` or `organizationId` - Organization identifier

### Recommended
- `caseId` - Case identifier (for family law)
- `userId` or `requestedBy` - User who requested evaluation

### Example

```json
{
  "task": {
    ...
    "metadata": {
      "orgId": "org_abc123",
      "caseId": "FL-2025-00123",
      "userId": "user_xyz789"
    }
  }
}
```

---

## Database Queries

### Get all evaluations for an organization

```sql
SELECT * FROM evaluations 
WHERE org_id = 'org_abc123' 
ORDER BY created_at DESC;
```

### Get Best Interest evaluation with dimensions

```sql
SELECT 
  e.*,
  json_agg(
    json_build_object(
      'dimension', d.dimension_name,
      'score', d.score,
      'reasoning', d.reasoning
    )
  ) as dimensions
FROM evaluations e
LEFT JOIN evaluation_dimension_scores d ON d.evaluation_id = e.id
WHERE e.id = '660e8400-e29b-41d4-a716-446655440000'
GROUP BY e.id;
```

### Get AgentOS events for a task

```sql
SELECT * FROM agentos_event_log 
WHERE task_id = 'eval_1733500000' 
ORDER BY created_at ASC;
```

### Analytics: Average scores by evaluation type

```sql
SELECT 
  evaluation_type,
  model_flavor,
  AVG(overall_score) as avg_score,
  COUNT(*) as total_evals
FROM evaluations
WHERE org_id = 'org_abc123'
GROUP BY evaluation_type, model_flavor;
```

---

## Testing

### Test database connection

```bash
node -e "const { logEvaluation } = require('./lib/tiqologyDb.ts'); logEvaluation({ orgId: 'test', evaluationType: 'ghost', modelFlavor: 'fast', overallScore: 100 }).then(console.log);"
```

### Verify logging in API response

```bash
curl -X POST http://localhost:3000/api/agent-router \
  -H "Content-Type: application/json" \
  -d '{
    "task": {
      "id": "test_001",
      "origin": "test",
      "targetAgents": ["ghost-evaluator"],
      "domain": "general",
      "kind": "evaluation",
      "payload": {
        "evaluationPrompt": "Test",
        "content": "Test content"
      },
      "metadata": {
        "orgId": "test_org"
      }
    }
  }'
```

Check response for:
- `result.data.evaluationId` - Should be a UUID
- `loggingError` - Should not be present (unless DB issue)

---

## Troubleshooting

### Issue: "Missing Supabase credentials"

**Cause:** Environment variables not set.

**Fix:**
```bash
# Add to .env.local
TIQ_SUPABASE_URL=https://your-project.supabase.co
TIQ_SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Issue: "Evaluation insert failed: Connection timeout"

**Cause:** Supabase network issue or incorrect URL.

**Fix:**
- Verify `TIQ_SUPABASE_URL` is correct
- Check Supabase project is not paused
- Verify network connectivity

### Issue: Dimension scores not inserted

**Cause:** Missing dimension data in payload.

**Fix:** Ensure Best Interest evaluations return dimension scores:
```typescript
dimensions: [
  { dimensionName: 'Stability', score: 75, reasoning: '...' },
  ...
]
```

### Issue: `loggingError` in response

**Cause:** Database insert failed but evaluation completed.

**Action:**
- Check console logs for detailed error
- Verify table schema matches expected structure
- Evaluation still succeeded; log failure is non-blocking

---

## Security

### Row Level Security (RLS)

Recommended RLS policies for production:

```sql
-- Only allow service role to insert
CREATE POLICY "Service role can insert evaluations"
ON evaluations FOR INSERT
TO service_role
WITH CHECK (true);

-- Organizations can read their own data
CREATE POLICY "Organizations can read own evaluations"
ON evaluations FOR SELECT
USING (org_id = current_setting('app.current_org_id'));
```

### Data Privacy

- **No PII in raw_request/raw_response** - Use pseudonyms ("Parent A", "Parent B")
- **Encrypt sensitive fields** - Consider encrypting `summary` and `reasoning`
- **Retention policy** - Set up automatic data deletion after retention period

---

## Version History

**v1.0** (December 6, 2025)
- Initial TiQology Core DB integration
- Support for Ghost and Best Interest evaluations
- Dimension score tracking
- AgentOS event logging
- Non-blocking error handling

---

## Support

- **Documentation:** `/docs/TIQOLOGY_CORE_DB.md`
- **AgentOS Docs:** `/docs/AGENTOS_V1_OVERVIEW.md`
- **Schema:** Contact TiQology DB team for full schema
- **Issues:** https://github.com/MrAllgoodWilson/ai-chatbot/issues
