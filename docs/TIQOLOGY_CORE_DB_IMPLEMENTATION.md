# TiQology Core DB Integration - Implementation Summary

## Changes Made

This commit integrates **TiQology Core Database** (Supabase) with AgentOS v1.0, enabling automatic logging of all Ghost and Best Interest evaluations.

---

## Files Added

### 1. **`lib/tiqologyDb.ts`** (New - 221 lines)

Supabase client module with three main functions:

**Functions:**
- `logEvaluation()` - Log evaluation to `evaluations` and `evaluation_dimension_scores` tables
- `logAgentOSEvent()` - Log execution events to `agentos_event_log` table
- `extractEvaluationMetadata()` - Helper to extract org/case/user IDs from task metadata

**Features:**
- Singleton Supabase client with service role key
- Non-blocking error handling (returns `loggingError` without breaking API)
- Support for dimension scores (Best Interest)
- Full request/response logging for audit trails

**Environment Variables:**
- `TIQ_SUPABASE_URL` - Supabase project URL
- `TIQ_SUPABASE_SERVICE_ROLE_KEY` - Service role key for server-side access

---

## Files Modified

### 2. **`lib/agentos/router.ts`** (Updated)

Added database logging to both evaluation agents:

**Ghost Evaluator:**
- Logs to `evaluations` table with `evaluation_type = 'ghost'`
- Determines `model_flavor` from payload ('fast' or 'deep')
- Logs AgentOS event with score and model metadata
- Returns `evaluationId` in response data

**Best Interest Engine:**
- Logs to `evaluations` table with `evaluation_type = 'best_interest'`
- Inserts 4 dimension scores (Stability, Emotional, Safety, Development)
- Logs AgentOS event with overall score
- Returns `evaluationId` in response data

**Error Handling:**
- DB insert failures add `loggingError` field to response
- API response still succeeds even if logging fails
- Errors logged to console for debugging

---

### 3. **`docs/TIQOLOGY_CORE_DB.md`** (New - 550+ lines)

Complete integration documentation including:

**Sections:**
- Database schema (3 tables: evaluations, dimension_scores, event_log)
- Environment variable setup
- Automatic logging flow diagram
- API reference for all functions
- Example payloads for Ghost and Best Interest
- Database queries for analytics
- Troubleshooting guide
- Security recommendations (RLS policies)

---

### 4. **`package.json`** (Updated)

**Dependency Added:**
- `@supabase/supabase-js@2.86.2` - Official Supabase client library

---

## Database Schema

### Table: `evaluations`

```sql
CREATE TABLE public.evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id TEXT NOT NULL,
  case_id TEXT,
  evaluator_user_id TEXT,
  evaluation_type TEXT NOT NULL,  -- 'ghost' | 'best_interest'
  model_flavor TEXT NOT NULL,     -- 'fast' | 'deep'
  overall_score INTEGER NOT NULL,
  summary TEXT,
  raw_request JSONB,
  raw_response JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Table: `evaluation_dimension_scores`

```sql
CREATE TABLE public.evaluation_dimension_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_id UUID NOT NULL REFERENCES evaluations(id),
  dimension_name TEXT NOT NULL,
  score INTEGER NOT NULL,
  reasoning TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Table: `agentos_event_log`

```sql
CREATE TABLE public.agentos_event_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  agent_id TEXT NOT NULL,
  task_id TEXT NOT NULL,
  org_id TEXT,
  case_id TEXT,
  user_id TEXT,
  status TEXT NOT NULL,
  metadata JSONB,
  error_details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Integration Flow

### Ghost Evaluation

```
1. POST /api/agent-router
   └─> routeAgentTask()
       └─> executeGhostEvaluator()
           ├─> Call /api/ghost (internal)
           ├─> logEvaluation() → evaluations table
           ├─> logAgentOSEvent() → agentos_event_log
           └─> Return result with evaluationId
```

### Best Interest Evaluation

```
1. POST /api/agent-router
   └─> routeAgentTask()
       └─> executeBestInterestEngine()
           ├─> Call /api/ghost with specialized prompt
           ├─> Parse 4-dimensional scores
           ├─> logEvaluation() → evaluations + dimension_scores
           ├─> logAgentOSEvent() → agentos_event_log
           └─> Return result with evaluationId
```

---

## Example Payloads

### Ghost Evaluation Request

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

### Ghost Evaluation Response

```json
{
  "taskId": "eval_1733500000",
  "status": "completed",
  "result": {
    "data": {
      "score": 35,
      "feedback": "Email lacks professional structure...",
      "fullResponse": "...",
      "model": "chat-model",
      "evaluationId": "550e8400-e29b-41d4-a716-446655440000"
    },
    "summary": "Evaluation completed with score: 35",
    "confidence": 0.35
  },
  "trace": { ... },
  "completedAt": 1733500015000
}
```

### Best Interest Evaluation Response

```json
{
  "taskId": "bi_eval_1733500000",
  "status": "completed",
  "result": {
    "data": {
      "stability": 75,
      "emotional": 85,
      "safety": 90,
      "development": 80,
      "overall": 82,
      "evaluationId": "660e8400-e29b-41d4-a716-446655440000"
    },
    "summary": "Best Interest evaluation completed. Overall score: 82",
    "confidence": 0.82
  },
  "trace": { ... },
  "completedAt": 1733500030000
}
```

---

## Metadata Requirements

Include in `task.metadata` for proper logging:

**Required:**
- `orgId` or `organizationId` - Organization identifier

**Recommended:**
- `caseId` - Case identifier (family law)
- `userId` or `requestedBy` - User who requested evaluation

**Example:**

```json
{
  "metadata": {
    "orgId": "org_abc123",
    "caseId": "FL-2025-00123",
    "userId": "attorney_001"
  }
}
```

---

## Error Handling

### Non-Blocking Failures

If database insert fails:
- ✅ API response still returns successfully
- ❌ `loggingError` field added to response
- 📝 Error logged to console

**Example:**

```json
{
  "taskId": "eval_12345",
  "status": "completed",
  "result": { ... },
  "loggingError": "Evaluation insert failed: Connection timeout"
}
```

### Missing Environment Variables

```
Error: Missing Supabase credentials. Set TIQ_SUPABASE_URL and TIQ_SUPABASE_SERVICE_ROLE_KEY
```

**Fix:** Add to `.env.local`:
```bash
TIQ_SUPABASE_URL=https://your-project.supabase.co
TIQ_SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

---

## Analytics Queries

### Average scores by type

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

### Best Interest with dimensions

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
WHERE e.id = '660e8400-...'
GROUP BY e.id;
```

### AgentOS event timeline

```sql
SELECT * FROM agentos_event_log 
WHERE task_id = 'eval_1733500000' 
ORDER BY created_at ASC;
```

---

## Testing

### 1. Verify Supabase connection

```bash
# Test environment variables
echo $TIQ_SUPABASE_URL
echo $TIQ_SUPABASE_SERVICE_ROLE_KEY
```

### 2. Test Ghost evaluation with logging

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
        "evaluationPrompt": "Test evaluation",
        "content": "Test content"
      },
      "metadata": {
        "orgId": "test_org",
        "userId": "test_user"
      }
    }
  }'
```

**Expected response:**
- `result.data.evaluationId` should be a UUID
- No `loggingError` field (unless DB issue)

### 3. Verify database records

```sql
-- Check latest evaluation
SELECT * FROM evaluations 
ORDER BY created_at DESC 
LIMIT 1;

-- Check event log
SELECT * FROM agentos_event_log 
ORDER BY created_at DESC 
LIMIT 1;
```

---

## Security Considerations

### Service Role Key

⚠️ **Never expose service role key in:**
- Client-side code
- Git commits
- Public repositories
- Frontend environment variables

✅ **Only use in:**
- Server-side code (Next.js API routes)
- Environment variables (`.env.local`)
- Secure deployment configs (Vercel secrets)

### Row Level Security (RLS)

Recommended policies:

```sql
-- Service role can insert
CREATE POLICY "Service role inserts"
ON evaluations FOR INSERT
TO service_role
WITH CHECK (true);

-- Orgs read own data
CREATE POLICY "Orgs read own"
ON evaluations FOR SELECT
USING (org_id = current_setting('app.current_org_id'));
```

### Data Privacy

- Use pseudonyms in `raw_request` ("Parent A", not real names)
- Consider encrypting sensitive fields
- Set up data retention policies
- Comply with GDPR/CCPA requirements

---

## Next Steps

### For TiQology Apps

1. **Set environment variables** in deployment
2. **Include metadata** in all evaluation requests
3. **Monitor** `loggingError` responses
4. **Build analytics** dashboards from evaluation data

### For Platform Team

1. **Create Supabase project** if not exists
2. **Run migrations** to create tables
3. **Set up RLS policies** for multi-tenant security
4. **Configure monitoring** for insert failures
5. **Document** retention and archival policies

---

## Version History

**v1.0** (December 6, 2025)
- Initial TiQology Core DB integration
- Ghost and Best Interest evaluation logging
- Dimension score tracking for Best Interest
- AgentOS event logging for all tasks
- Non-blocking error handling
- Full documentation and examples

---

## Summary

✅ **Database logging integrated** for all evaluations  
✅ **Non-blocking error handling** (API never fails due to DB)  
✅ **Complete audit trail** with request/response logging  
✅ **Dimension tracking** for Best Interest evaluations  
✅ **Event logging** for AgentOS execution timeline  
✅ **Production-ready** with security best practices  

**Status:** ✅ READY FOR DEPLOYMENT

**Required for production:**
- Set `TIQ_SUPABASE_URL` and `TIQ_SUPABASE_SERVICE_ROLE_KEY`
- Create database tables (see schema above)
- Configure RLS policies
- Monitor logging errors in production
