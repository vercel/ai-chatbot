# AgentOS Overview

## Vision

**AgentOS** is TiQology's global multi-agent control layer — a unified orchestration system that standardizes how all AI agents, automation pipelines, and human-in-the-loop workflows communicate across the entire TiQology ecosystem.

## Core Concepts

### 1. Unified Task Schema

All agent interactions use a single `AgentTask` interface:

```typescript
interface AgentTask {
  id: string;                    // Unique task identifier
  origin: string;                // Origin app (e.g., "tiqology-spa")
  targetAgents: string[];        // Agent IDs to handle task
  domain: AgentDomain;           // Task domain
  kind: AgentKind;               // Task type
  priority: TaskPriority;        // Execution priority
  payload: Record<string, any>;  // Task-specific data
  metadata?: {...};              // Optional metadata
  createdAt: number;             // Unix timestamp
}
```

### 2. Agent Registry

All agents are registered in a central registry with capabilities:

- **ghost-evaluator**: AI evaluation using Claude models
- **best-interest-engine**: Family law evaluations
- **devin-builder**: Human-in-the-loop build tasks
- **rocket-ops**: Human-in-the-loop operations

### 3. Single Router Endpoint

All TiQology apps call `/api/agent-router` with standardized tasks:

```typescript
POST /api/agent-router
{
  "task": AgentTask
}

Response:
{
  "taskId": string,
  "result": { data, summary, confidence },
  "trace": { steps, totalDuration }
}
```

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     TiQology Apps                       │
│  (tiqology-spa, mobile apps, integrations)              │
└────────────────────┬────────────────────────────────────┘
                     │
                     │ AgentTask JSON
                     ▼
┌─────────────────────────────────────────────────────────┐
│                  /api/agent-router                      │
│              (AgentOS Entry Point)                      │
└────────────────────┬────────────────────────────────────┘
                     │
                     │ Route to Agent
                     ▼
┌─────────────────────────────────────────────────────────┐
│                  Agent Router                           │
│   - Validates task                                      │
│   - Selects appropriate agent                           │
│   - Executes agent logic                                │
│   - Returns standardized result                         │
└───┬──────────┬──────────┬──────────┬────────────────────┘
    │          │          │          │
    ▼          ▼          ▼          ▼
┌────────┐ ┌──────┐ ┌──────┐ ┌────────────┐
│ Ghost  │ │ Best │ │Devin │ │  Rocket    │
│  Eval  │ │Intr. │ │Build │ │   Ops      │
└────────┘ └──────┘ └──────┘ └────────────┘
```

## Agent Types

### Automated Agents

**Execute immediately** without human intervention:

- **ghost-evaluator**: AI evaluation via Ghost API
- **best-interest-engine**: Family law AI analysis

### Human-in-the-Loop Agents

**Generate templates** for human review and execution:

- **devin-builder**: Outputs Rocket-Devin TASK markdown
- **rocket-ops**: Outputs ops playbook markdown

## Task Domains

- `family-law`: Family law specific tasks
- `general`: General purpose tasks
- `dev-ops`: Development and operations
- `legal`: General legal domain
- `healthcare`: Healthcare domain
- `finance`: Financial domain

## Task Kinds

- `evaluation`: AI evaluation tasks
- `build`: Development/build tasks
- `ops`: Operations/deployment tasks
- `analysis`: Data analysis tasks
- `workflow`: Multi-step orchestration

## Execution Trace

Every task returns a detailed trace:

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
        "action": "execution_completed",
        "duration": 8234
      }
    ],
    "totalDuration": 8250,
    "intermediateResults": {...}
  }
}
```

## Error Handling

Standardized error codes:

- `AGENTOS_VALIDATION_ERROR`: Invalid task structure
- `AGENTOS_ROUTING_ERROR`: Routing failed
- `AGENTOS_AGENT_NOT_FOUND`: No suitable agent
- `AGENTOS_EXECUTION_ERROR`: Agent execution failed
- `AGENTOS_TIMEOUT_ERROR`: Task timed out
- `AGENTOS_AUTHENTICATION_ERROR`: Invalid API key
- `AGENTOS_RATE_LIMIT_ERROR`: Rate limit exceeded

## Integration Pattern

### From TiQology-spa

```typescript
const result = await fetch('https://ai-chatbot.vercel.app/api/agent-router', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': process.env.AGENTOS_API_KEY
  },
  body: JSON.stringify({
    task: {
      id: 'task_123',
      origin: 'tiqology-spa',
      targetAgents: ['ghost-evaluator'],
      domain: 'general',
      kind: 'evaluation',
      priority: 'normal',
      payload: {
        prompt: 'Evaluate this input...',
        model: 'chat-model'
      }
    }
  })
});

const { result: agentResult, trace } = await result.json();
```

## Benefits

1. **Standardization**: Single interface for all agent tasks
2. **Flexibility**: Easy to add new agents without changing apps
3. **Observability**: Detailed execution traces for debugging
4. **Scalability**: Centralized routing enables load balancing
5. **Separation of Concerns**: Apps don't need agent-specific logic
6. **Human-in-Loop Support**: Seamless integration of automated and manual workflows

## Future Enhancements (v2.0)

- Task queuing and background processing
- Agent capability negotiation
- Multi-agent collaboration (agents calling other agents)
- Real-time task status updates via WebSocket
- Agent performance analytics
- Conditional routing based on task complexity
- Agent versioning and A/B testing

---

**Version**: 1.0.0  
**Last Updated**: December 6, 2025  
**Status**: Production Ready
