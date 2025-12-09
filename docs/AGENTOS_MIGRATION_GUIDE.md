# AgentOS v1.0 Migration Guide

## Overview

This guide helps you migrate from the legacy `/api/ghost` endpoint to the new AgentOS v1.0 `/api/agent-router` endpoint.

**Timeline:**
- **Now:** `/api/ghost` is deprecated but remains functional
- **March 1, 2026:** `/api/ghost` will be removed

---

## Why Migrate?

### Benefits of AgentOS

✅ **Unified API** - One endpoint for all agent types  
✅ **Better error handling** - Standardized error codes and messages  
✅ **Execution tracing** - Track task flow for debugging  
✅ **Multi-agent support** - Route to different agents based on task type  
✅ **Future-proof** - New features and agents added automatically  

### What's Changing

| Feature | Legacy `/api/ghost` | AgentOS `/api/agent-router` |
|---------|---------------------|----------------------------|
| **Endpoint** | `/api/ghost` | `/api/agent-router` |
| **Request Format** | Simple prompt/context | Structured AgentTask JSON |
| **Response Format** | score/feedback/result | Standardized AgentResult |
| **Error Handling** | Generic errors | Typed error codes |
| **Tracing** | None | Full execution trace |
| **Multi-agent** | No | Yes |

---

## Migration Steps

### Step 1: Update Request Format

**Before (Legacy):**

```typescript
const response = await fetch('/api/ghost', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    prompt: "Evaluate this email for professionalism",
    context: { type: "client-email" },
    model: "chat-model"
  })
});

const result = await response.json();
// { score: 75, feedback: "...", result: "...", timestamp: "..." }
```

**After (AgentOS):**

```typescript
const response = await fetch('/api/agent-router', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    task: {
      id: `eval_${Date.now()}`,
      origin: "tiqology-spa",
      targetAgents: ["ghost-evaluator"],
      domain: "general",
      kind: "evaluation",
      priority: "normal",
      payload: {
        evaluationPrompt: "Evaluate this email for professionalism",
        content: "Dear Sir, I need help ASAP.",
        context: { type: "client-email" },
        model: "chat-model"
      },
      metadata: {
        userId: "user_123"
      }
    }
  })
});

const agentResult = await response.json();
// {
//   taskId: "eval_1733500000",
//   status: "completed",
//   result: {
//     data: { score: 75, feedback: "...", analysis: "..." },
//     confidence: 0.92
//   },
//   trace: { ... }
// }
```

### Step 2: Update Response Handling

**Before:**

```typescript
const { score, feedback, result } = await response.json();
console.log(`Score: ${score}/100`);
console.log(`Feedback: ${feedback}`);
```

**After:**

```typescript
const { result, status } = await response.json();

if (status === 'completed') {
  const { score, feedback, analysis } = result.data;
  console.log(`Score: ${score}/100`);
  console.log(`Feedback: ${feedback}`);
  console.log(`Analysis: ${analysis}`);
} else if (status === 'failed') {
  console.error('Task failed:', result.error);
}
```

### Step 3: Update Error Handling

**Before:**

```typescript
try {
  const response = await fetch('/api/ghost', { ... });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error);
  }
} catch (error) {
  console.error('Evaluation failed:', error);
}
```

**After:**

```typescript
try {
  const response = await fetch('/api/agent-router', { ... });
  if (!response.ok) {
    const { error } = await response.json();
    // error.code: AGENTOS_VALIDATION_ERROR, AGENTOS_ROUTING_ERROR, etc.
    // error.message: Human-readable error message
    // error.details: Additional context
    throw new Error(`${error.code}: ${error.message}`);
  }
} catch (error) {
  console.error('Task failed:', error);
}
```

---

## React Hook Migration

### Using `useGhostEval` Hook

The `useGhostEval` hook has been updated to use AgentOS internally. Update your imports and usage:

**Before (v1.0):**

```typescript
import { useGhostEval } from '@/hooks/use-ghost-eval';

const { evaluate } = useGhostEval({
  endpoint: '/api/ghost'
});

const result = await evaluate({
  prompt: "Evaluate this content",
  context: { ... }
});
```

**After (v2.0 - AgentOS):**

```typescript
import { useGhostEval } from '@/hooks/use-ghost-eval';

const { evaluate } = useGhostEval({
  origin: 'tiqology-spa', // Your app identifier
  endpoint: '/api/agent-router' // Default value
});

const result = await evaluate({
  prompt: "Evaluate this content",
  content: "The actual content to evaluate",
  context: { ... }
});

// result now includes: score, feedback, result, confidence
```

**Note:** The hook maintains backward compatibility but adds new fields like `confidence` and better error handling.

---

## Domain-Specific Migrations

### Family Law: Best Interest Evaluations

If you're using Ghost for Best Interest evaluations, switch to the `best-interest-engine` agent:

**Before:**

```typescript
const response = await fetch('/api/ghost', {
  method: 'POST',
  body: JSON.stringify({
    prompt: "Evaluate custody arrangement for 7-year-old child. Mother has primary custody, father seeks joint."
  })
});
```

**After (Use Best Interest Agent):**

```typescript
const response = await fetch('/api/agent-router', {
  method: 'POST',
  body: JSON.stringify({
    task: {
      id: `bi_eval_${Date.now()}`,
      origin: "tiqology-spa",
      targetAgents: ["best-interest-engine"],
      domain: "family-law",
      kind: "evaluation",
      priority: "high",
      payload: {
        caseContext: "Custody dispute for 7-year-old",
        evaluationFocus: "joint-custody",
        parentAInfo: { /* mother's info */ },
        parentBInfo: { /* father's info */ },
        childInfo: { age: 7, preferences: "..." }
      }
    }
  })
});

// Response includes 4-dimensional scoring:
// { stability: 75, emotional: 85, safety: 90, development: 80, overall: 82 }
```

See the **TiQology Global Contract** section in `docs/AGENTOS_V1_OVERVIEW.md` for the full canonical format.

---

## Testing Your Migration

### 1. Test Basic Evaluation

```bash
curl -X POST http://localhost:3000/api/agent-router \
  -H "Content-Type: application/json" \
  -d '{
    "task": {
      "id": "test_eval_001",
      "origin": "migration-test",
      "targetAgents": ["ghost-evaluator"],
      "domain": "general",
      "kind": "evaluation",
      "priority": "normal",
      "payload": {
        "evaluationPrompt": "Test evaluation",
        "content": "Test content"
      }
    }
  }'
```

### 2. Verify Response Structure

```typescript
const result = await response.json();

assert(result.taskId);
assert(result.status === 'completed' || result.status === 'failed');
assert(result.result || result.error);
assert(result.trace);
assert(result.completedAt);
```

### 3. Test Error Handling

```bash
# Invalid task (missing required fields)
curl -X POST http://localhost:3000/api/agent-router \
  -H "Content-Type: application/json" \
  -d '{ "task": {} }'

# Expected response: 400 with AGENTOS_VALIDATION_ERROR
```

---

## Migration Checklist

- [ ] Replace all `/api/ghost` calls with `/api/agent-router`
- [ ] Update request format to use AgentTask schema
- [ ] Update response parsing to use AgentResult schema
- [ ] Update error handling to use typed error codes
- [ ] Test all evaluation flows end-to-end
- [ ] Update environment variables if using API keys
- [ ] Update documentation for your team
- [ ] Remove hardcoded `/api/ghost` references from code
- [ ] Update `useGhostEval` hook calls to include `origin` parameter
- [ ] Test performance (AgentOS adds minimal overhead)

---

## Common Issues

### Issue 1: "AGENTOS_VALIDATION_ERROR: Missing required field: task"

**Cause:** You're sending the request without wrapping it in a `task` object.

**Fix:**
```typescript
// ❌ Wrong
body: JSON.stringify({ id: "...", origin: "...", ... })

// ✅ Correct
body: JSON.stringify({ task: { id: "...", origin: "...", ... } })
```

### Issue 2: Response structure changed

**Cause:** AgentOS returns a different structure than legacy Ghost API.

**Fix:** Access data via `result.result.data` instead of top-level fields:
```typescript
// ❌ Legacy
const { score, feedback } = await response.json();

// ✅ AgentOS
const { result } = await response.json();
const { score, feedback } = result.data;
```

### Issue 3: Hook not working after update

**Cause:** Hook now requires `origin` parameter.

**Fix:**
```typescript
const { evaluate } = useGhostEval({
  origin: 'tiqology-spa' // Add your app identifier
});
```

---

## Need Help?

- **Documentation:** `/docs/AGENTOS_V1_OVERVIEW.md`
- **Examples:** See "TiQology Global Contract" section
- **Test Script:** `node scripts/test-agentos.js`
- **GitHub Issues:** https://github.com/MrAllgoodWilson/ai-chatbot/issues

---

**Migration Support Timeline:**

- **Dec 2025 - Feb 2026:** Dual support (both endpoints work)
- **March 1, 2026:** Legacy `/api/ghost` removed
- **After March 2026:** AgentOS only

**Recommended:** Migrate immediately to take advantage of new features and ensure compatibility with future TiQology updates.
