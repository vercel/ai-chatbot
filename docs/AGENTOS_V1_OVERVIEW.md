# AgentOS v1.0 - Overview & Integration Guide

## What is AgentOS?

**AgentOS** is TiQology's unified multi-agent orchestration layer. It provides a single API endpoint (`/api/agent-router`) that standardizes how all AI agents, automation pipelines, and human-in-the-loop workflows communicate across the entire TiQology ecosystem.

Think of it as the **"operating system for agents"** — a control layer that routes tasks to the right agent, tracks execution, and returns standardized results.

---

## Why AgentOS?

### Before AgentOS
- Each feature had custom API integration
- Different response formats for each agent
- No standardized error handling
- Difficult to add new agents
- No execution tracing or observability

### With AgentOS
- ✅ **Single API endpoint** for all agent tasks
- ✅ **Standardized task schema** (JSON)
- ✅ **Unified error handling** with clear error codes
- ✅ **Execution tracing** for debugging and monitoring
- ✅ **Easy extensibility** — add new agents without changing apps
- ✅ **Human-in-loop support** — seamless integration of manual workflows

---

## Core Concepts

### 1. AgentTask Schema

All tasks follow this structure:

```typescript
interface AgentTask {
  id: string;                     // Unique task ID
  origin: string;                 // Origin app (e.g., "tiqology-spa")
  targetAgents: string[];         // Agents to try (in priority order)
  domain: AgentDomain;            // Task domain
  kind: AgentKind;                // Task type
  priority: TaskPriority;         // Execution priority
  payload: Record<string, any>;   // Task-specific data
  metadata?: {...};               // Optional metadata
  createdAt: number;              // Unix timestamp
}
```

**Supported Domains:**
- `family-law` - Family law specific
- `general` - General purpose
- `dev-ops` - Development & operations
- `legal` - General legal
- `healthcare` - Healthcare
- `finance` - Financial

**Supported Task Kinds:**
- `evaluation` - AI evaluation tasks
- `build` - Development/build tasks
- `ops` - Operations/deployment
- `analysis` - Data analysis
- `workflow` - Multi-step orchestration

### 2. Agent Registry

Four agents available in v1.0:

| Agent ID | Type | Purpose | Output |
|----------|------|---------|--------|
| `ghost-evaluator` | Automated | AI evaluation with Claude | Score + feedback |
| `best-interest-engine` | Automated | Family law analysis | 4-dimensional scores |
| `devin-builder` | Human-in-loop | Build task planning | Rocket-Devin task template |
| `rocket-ops` | Human-in-loop | Ops playbooks | Ops runbook markdown |

### 3. AgentResult Schema

All agents return standardized results:

```typescript
interface AgentResult {
  taskId: string;
  agentId: string;
  status: TaskStatus;            // 'completed' | 'failed' | etc.
  result?: {
    data: Record<string, any>;
    summary?: string;
    confidence?: number;         // 0-1
  };
  error?: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
  trace: AgentTrace;             // Execution trace
  completedAt: number;           // Unix timestamp
}
```

---

## API Endpoint

### POST /api/agent-router

**URL:** `https://ai-chatbot.vercel.app/api/agent-router`

**Headers:**
```
Content-Type: application/json
x-api-key: <AGENTOS_API_KEY>
```

**Request Body:**
```json
{
  "task": {
    "id": "task_123",
    "origin": "tiqology-spa",
    "targetAgents": ["ghost-evaluator"],
    "domain": "general",
    "kind": "evaluation",
    "priority": "normal",
    "payload": {
      "prompt": "Evaluate this input...",
      "model": "chat-model"
    }
  }
}
```

**Response (Success):**
```json
{
  "taskId": "task_123",
  "result": {
    "data": {
      "score": 85,
      "feedback": "Input is well-structured...",
      "fullResponse": "..."
    },
    "summary": "Evaluation completed with score: 85",
    "confidence": 0.85
  },
  "trace": {
    "steps": [...],
    "totalDuration": 5230
  },
  "status": "completed",
  "completedAt": 1733519425000
}
```

**Response (Error):**
```json
{
  "taskId": "task_123",
  "error": {
    "code": "AGENTOS_AGENT_NOT_FOUND",
    "message": "No suitable agent found for kind: evaluation, domain: healthcare"
  },
  "trace": {
    "steps": [...],
    "totalDuration": 120
  }
}
```

### GET /api/agent-router

Health check endpoint:

```bash
curl https://ai-chatbot.vercel.app/api/agent-router
```

Returns:
```json
{
  "status": "healthy",
  "service": "agentos-router",
  "version": "1.0.0",
  "availableAgents": [
    "ghost-evaluator",
    "best-interest-engine",
    "devin-builder",
    "rocket-ops"
  ]
}
```

---

## Usage Examples

### Example 1: Ghost Evaluation (JavaScript/TypeScript)

```typescript
const response = await fetch('https://ai-chatbot.vercel.app/api/agent-router', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': process.env.AGENTOS_API_KEY
  },
  body: JSON.stringify({
    task: {
      id: `eval_${Date.now()}`,
      origin: 'tiqology-spa',
      targetAgents: ['ghost-evaluator'],
      domain: 'general',
      kind: 'evaluation',
      priority: 'normal',
      payload: {
        prompt: 'Evaluate the quality of this user input: "Lorem ipsum..."',
        context: 'Form validation',
        model: 'chat-model'
      }
    }
  })
});

const result = await response.json();
console.log('Score:', result.result.data.score);
console.log('Feedback:', result.result.data.feedback);
```

### Example 2: Best Interest Evaluation

```typescript
const response = await fetch('https://ai-chatbot.vercel.app/api/agent-router', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': process.env.AGENTOS_API_KEY
  },
  body: JSON.stringify({
    task: {
      id: `best_interest_${Date.now()}`,
      origin: 'tiqology-spa',
      targetAgents: ['best-interest-engine'],
      domain: 'family-law',
      kind: 'evaluation',
      priority: 'high',
      payload: {
        parentingPlan: 'Joint legal custody, primary physical with Mother...',
        communication: 'Weekly email check-ins...',
        incidents: 'No documented incidents...',
        childProfile: '7-year-old girl, well-adjusted...',
        model: 'chat-model'
      }
    }
  })
});

const result = await response.json();
const scores = result.result.data;
console.log('Stability:', scores.stability);
console.log('Safety:', scores.safety);
console.log('Cooperation:', scores.cooperation);
console.log('Emotional Impact:', scores.emotionalImpact);
console.log('Overall:', scores.overall);
console.log('Summary:', scores.summary);
console.log('Recommendations:', scores.recommendations);
```

### Example 3: Devin Build Task (Human-in-Loop)

```typescript
const response = await fetch('https://ai-chatbot.vercel.app/api/agent-router', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': process.env.AGENTOS_API_KEY
  },
  body: JSON.stringify({
    task: {
      id: `build_${Date.now()}`,
      origin: 'tiqology-spa',
      targetAgents: ['devin-builder'],
      domain: 'dev-ops',
      kind: 'build',
      priority: 'high',
      payload: {
        description: 'Build document upload and AI analysis feature',
        requirements: [
          'File upload with drag-and-drop',
          'Support PDF, DOCX, TXT',
          'Ghost API integration',
          'Display scores and summaries'
        ],
        context: 'Legal document analysis',
        targetRepo: 'TiQology-spa',
        priority: 'high'
      }
    }
  })
});

const result = await response.json();
const taskTemplate = result.result.data.taskTemplate;
console.log(taskTemplate); // Markdown task template
```

### Example 4: Using Pre-built Pipelines

For common use cases, use pre-built pipeline functions:

```typescript
import { bestInterestEvaluationPipeline } from '@/lib/agentos/pipelines';

const result = await bestInterestEvaluationPipeline(
  {
    parentingPlan: '...',
    communication: '...',
    incidents: '...',
    childProfile: '...',
    model: 'claude-3-7-sonnet-latest'
  },
  {
    origin: 'tiqology-spa',
    userId: 'user_123'
  }
);

console.log(result.result.data);
```

---

## Error Handling

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `AGENTOS_VALIDATION_ERROR` | 400 | Invalid task structure |
| `AGENTOS_AUTHENTICATION_ERROR` | 401 | Invalid API key |
| `AGENTOS_AGENT_NOT_FOUND` | 404 | No suitable agent |
| `AGENTOS_TIMEOUT_ERROR` | 408 | Task timeout |
| `AGENTOS_RATE_LIMIT_ERROR` | 429 | Rate limit exceeded |
| `AGENTOS_ROUTING_ERROR` | 500 | Routing failed |
| `AGENTOS_EXECUTION_ERROR` | 500 | Agent execution failed |

### Error Handling Pattern

```typescript
try {
  const response = await fetch('/api/agent-router', {...});
  const result = await response.json();
  
  if (!response.ok) {
    // Handle error
    switch (result.error.code) {
      case 'AGENTOS_VALIDATION_ERROR':
        console.error('Invalid task:', result.error.message);
        break;
      case 'AGENTOS_AGENT_NOT_FOUND':
        console.error('No agent available:', result.error.message);
        break;
      default:
        console.error('Unknown error:', result.error.message);
    }
    return;
  }
  
  // Process successful result
  console.log(result.result.data);
  
} catch (error) {
  console.error('Network error:', error);
}
```

---

## Execution Tracing

Every task returns a detailed execution trace for debugging:

```typescript
{
  "trace": {
    "steps": [
      {
        "timestamp": 1733519400000,
        "agent": "router",
        "action": "task_validated",
        "duration": 5
      },
      {
        "timestamp": 1733519405000,
        "agent": "ghost-evaluator",
        "action": "execution_started"
      },
      {
        "timestamp": 1733519427000,
        "agent": "ghost-evaluator",
        "action": "execution_completed",
        "duration": 22000
      }
    ],
    "totalDuration": 27000,
    "intermediateResults": {
      "ghostResponse": {...}
    }
  }
}
```

Use trace data for:
- Performance monitoring
- Debugging failures
- Identifying bottlenecks
- Analytics

---

## Integration Checklist

### For TiQology-spa

- [ ] Add `AGENTOS_API_KEY` to environment variables
- [ ] Install fetch polyfill (if needed for Node.js)
- [ ] Create agent client wrapper utility
- [ ] Add error handling for all error codes
- [ ] Implement loading states for async calls
- [ ] Display execution traces in dev mode
- [ ] Add retry logic for transient errors
- [ ] Monitor task performance metrics

### For Mobile Apps

- [ ] Add AgentOS endpoint to API config
- [ ] Implement task queue for offline support
- [ ] Add network error handling
- [ ] Cache results when appropriate
- [ ] Display loading indicators
- [ ] Handle rate limiting gracefully

---

## Performance Considerations

### Typical Response Times

| Agent | Typical Duration | Max Duration |
|-------|------------------|--------------|
| ghost-evaluator | 5-10s | 30s |
| best-interest-engine | 15-30s | 60s |
| devin-builder | <1s (template generation) | 5s |
| rocket-ops | <1s (playbook generation) | 5s |

### Optimization Tips

1. **Use appropriate models:**
   - Fast analysis: `claude-3-5-haiku-latest`
   - Deep analysis: `claude-3-7-sonnet-latest`

2. **Implement timeouts:**
   ```typescript
   const controller = new AbortController();
   setTimeout(() => controller.abort(), 30000); // 30s timeout
   
   fetch('/api/agent-router', {
     signal: controller.signal,
     ...
   });
   ```

3. **Cache results** when appropriate (user profile, static analysis)

4. **Use pre-built pipelines** for common use cases

---

## Security

### API Key Management

- Store `AGENTOS_API_KEY` in environment variables
- Never commit API keys to version control
- Rotate keys regularly
- Use different keys for dev/staging/production

### Data Privacy

- Do **NOT** send PII (names, addresses, SSNs) in payloads
- Use pseudonyms (e.g., "Parent A", "Parent B")
- Sanitize user input before sending
- Comply with GDPR/CCPA data handling requirements

---

## Monitoring & Analytics

### Recommended Metrics

- **Task volume** by agent, domain, kind
- **Success rate** (completed vs failed)
- **Response time** (p50, p95, p99)
- **Error rate** by error code
- **User satisfaction** ratings

### Logging

All tasks are automatically traced. Access logs via:
- Vercel deployment logs
- Application monitoring tools (Datadog, New Relic, etc.)

---

## TiQology Global Contract

**This section defines the canonical task format for all TiQology applications.** Use these exact JSON structures to ensure compatibility across the entire TiQology ecosystem.

### Canonical Task: `family-law.best-interest`

**Use case:** Evaluate custody arrangements, parenting plans, or any decision affecting children in family law cases.

**Request to `/api/agent-router`:**

```json
{
  "task": {
    "id": "tiq_best_interest_20251206_001",
    "origin": "tiqology-spa",
    "targetAgents": ["best-interest-engine"],
    "domain": "family-law",
    "kind": "evaluation",
    "priority": "high",
    "payload": {
      "caseContext": "Mother seeking primary custody. Father has stable job but limited parenting history.",
      "evaluationFocus": "primary-custody",
      "parentAInfo": {
        "name": "Mother",
        "strengths": "Strong bond with child, flexible work schedule, involved in school",
        "concerns": "Limited financial resources"
      },
      "parentBInfo": {
        "name": "Father", 
        "strengths": "Stable income, supportive family network",
        "concerns": "Limited parenting history, works long hours"
      },
      "childInfo": {
        "age": 7,
        "preferences": "Wants equal time with both parents",
        "specialNeeds": null
      }
    },
    "metadata": {
      "caseId": "FL-2025-00123",
      "jurisdiction": "California",
      "requestedBy": "user_abc123"
    }
  }
}
```

**Response (200 OK):**

```json
{
  "taskId": "tiq_best_interest_20251206_001",
  "status": "completed",
  "result": {
    "data": {
      "scores": {
        "stability": 75,
        "emotional": 85,
        "safety": 90,
        "development": 80,
        "overall": 82
      },
      "recommendation": "Joint custody with mother as primary physical custodian",
      "strengths": [
        "Both parents show commitment to child's wellbeing",
        "Child expresses desire for continued relationship with both parents"
      ],
      "concerns": [
        "Father's work schedule may limit availability for day-to-day care"
      ],
      "rationale": "Mother's flexible schedule and strong emotional bond support primary physical custody, while father's financial stability and family support warrant significant parenting time."
    },
    "summary": "Best Interest evaluation completed. Overall score: 82/100. Recommendation: Joint custody with mother as primary physical custodian.",
    "confidence": 0.87
  },
  "trace": {
    "routedTo": "best-interest-engine",
    "steps": [
      {
        "timestamp": 1733500000000,
        "action": "Task received",
        "details": {}
      },
      {
        "timestamp": 1733500002000,
        "action": "Agent selected",
        "details": { "agentId": "best-interest-engine" }
      },
      {
        "timestamp": 1733500015000,
        "action": "Evaluation completed",
        "details": { "executionTime": "13s" }
      }
    ]
  },
  "completedAt": 1733500015000
}
```

---

### Canonical Task: `core.generic-eval`

**Use case:** Generic AI evaluation for content quality, sentiment analysis, form validation, or any general-purpose scoring task.

**Request to `/api/agent-router`:**

```json
{
  "task": {
    "id": "tiq_eval_20251206_002",
    "origin": "tiqology-spa",
    "targetAgents": ["ghost-evaluator"],
    "domain": "general",
    "kind": "evaluation",
    "priority": "normal",
    "payload": {
      "evaluationPrompt": "Evaluate the professionalism and clarity of this client communication email.",
      "content": "Hi, I need help with my case. Can you call me ASAP? Thanks.",
      "context": {
        "contentType": "client-email",
        "expectedTone": "professional"
      }
    },
    "metadata": {
      "userId": "user_xyz789",
      "feature": "email-drafting"
    }
  }
}
```

**Response (200 OK):**

```json
{
  "taskId": "tiq_eval_20251206_002",
  "status": "completed",
  "result": {
    "data": {
      "score": 35,
      "feedback": "Email lacks professional structure and specific details. Recommend rewriting with clear subject, greeting, detailed explanation of issue, and specific request.",
      "analysis": "The message is too casual for professional legal communication. It lacks context about the case, doesn't specify what help is needed, and uses informal language ('ASAP'). Professional emails should include: proper greeting, clear subject line, detailed description of the issue, specific questions or requests, and professional closing."
    },
    "summary": "Content evaluation completed. Score: 35/100. Recommendation: Significant improvement needed.",
    "confidence": 0.92
  },
  "trace": {
    "routedTo": "ghost-evaluator",
    "steps": [
      {
        "timestamp": 1733500100000,
        "action": "Task received",
        "details": {}
      },
      {
        "timestamp": 1733500101000,
        "action": "Agent selected",
        "details": { "agentId": "ghost-evaluator" }
      },
      {
        "timestamp": 1733500108000,
        "action": "Evaluation completed",
        "details": { "executionTime": "7s" }
      }
    ]
  },
  "completedAt": 1733500108000
}
```

---

### Integration Requirements

**All TiQology applications MUST:**

1. ✅ Use `/api/agent-router` as the single entry point
2. ✅ Send tasks in the canonical format shown above
3. ✅ Handle the standardized response structure
4. ✅ Include proper error handling for all error codes
5. ✅ Set appropriate `origin` field (e.g., "tiqology-spa", "tiqology-mobile")
6. ✅ Include `metadata.userId` for user tracking
7. ✅ Use semantic task IDs with timestamps

**DO NOT:**

❌ Call `/api/ghost` directly (deprecated in favor of AgentOS)  
❌ Implement custom agent integration patterns  
❌ Create task schemas outside of the defined domains  
❌ Skip error handling or trace logging  

**Migration from Legacy `/api/ghost`:**

If your app currently uses `/api/ghost`, migrate to AgentOS:

```typescript
// ❌ OLD (deprecated)
const response = await fetch('/api/ghost', {
  method: 'POST',
  body: JSON.stringify({ prompt: "...", context: {...} })
});

// ✅ NEW (AgentOS canonical)
const response = await fetch('/api/agent-router', {
  method: 'POST',
  body: JSON.stringify({
    task: {
      id: `eval_${Date.now()}`,
      origin: 'tiqology-spa',
      targetAgents: ['ghost-evaluator'],
      domain: 'general',
      kind: 'evaluation',
      priority: 'normal',
      payload: {
        evaluationPrompt: "...",
        content: "...",
        context: {...}
      }
    }
  })
});
```

---

## Future Enhancements (v2.0)

Planned features:

- [ ] **Task queuing** for background processing
- [ ] **WebSocket support** for real-time status updates
- [ ] **Agent collaboration** (agents calling other agents)
- [ ] **Conditional routing** based on task complexity
- [ ] **A/B testing** for agent versions
- [ ] **Performance analytics** dashboard
- [ ] **Rate limiting** per user/app
- [ ] **Webhook notifications** for task completion

---

## Support & Resources

- **Documentation:** `/docs/AGENTOS_V1_OVERVIEW.md`
- **Playbooks:** `/playbooks/agentos/`
- **GitHub Issues:** Report bugs and feature requests
- **Email:** support@tiqology.com

---

**Version:** 1.0.0  
**Last Updated:** December 6, 2025  
**Status:** Production Ready  
**Author:** TiQology Development Team
