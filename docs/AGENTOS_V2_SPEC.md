# AgentOS v2.0 Enhancement Specification

**Status:** Planning Phase  
**Target Release:** Month 3 (Weeks 11-12)  
**Owner:** Devin + Super Chat

---

## Executive Summary

AgentOS v2.0 transforms the current single-agent routing system into a **real-time, collaborative, multi-agent orchestration platform** with:

- **Real-time streaming** (WebSocket support)
- **Multi-agent collaboration** (agents working together on complex tasks)
- **Task queueing** (handle high-volume workloads)
- **Agent marketplace** (third-party agent plugins)
- **Workflow automation** (no-code agent pipelines)
- **Advanced monitoring** (live dashboards, performance metrics)

---

## v1.0 → v2.0 Comparison

| Feature | v1.0 (Current) | v2.0 (Target) |
|---------|----------------|---------------|
| **Routing** | Single agent per task | Multi-agent collaboration |
| **Execution** | Synchronous (wait for response) | Async + real-time streaming |
| **Communication** | HTTP REST | HTTP + WebSockets |
| **Queuing** | None (immediate execution) | Redis-based task queue |
| **Collaboration** | None (agents work independently) | Agents can call each other |
| **Marketplace** | 4 built-in agents only | Third-party agent plugins |
| **Workflows** | Manual task creation | No-code workflow builder |
| **Monitoring** | Basic traces | Live dashboards + analytics |

---

## Core Enhancements

### 1. Real-Time Streaming (WebSocket Support)

**Current Problem:**
- Clients must poll for task status
- No live progress updates
- Large AI responses take 10-30s with no feedback

**Solution:**
Implement WebSocket connections for real-time updates:

```typescript
// Client connects to WebSocket
const ws = new WebSocket('wss://api.tiqology.com/agentos/stream');

// Send task
ws.send(JSON.stringify({
  type: 'task',
  task: {
    id: 'task_123',
    targetAgents: ['ghost-evaluator'],
    // ... rest of task
  }
}));

// Receive real-time updates
ws.onmessage = (event) => {
  const update = JSON.parse(event.data);
  
  switch (update.type) {
    case 'status':
      // "Task queued", "Agent started", "Processing", etc.
      console.log(update.status);
      break;
    
    case 'stream':
      // Streaming AI response (word-by-word)
      appendText(update.chunk);
      break;
    
    case 'trace':
      // Execution step completed
      logTrace(update.step);
      break;
    
    case 'result':
      // Final result
      handleResult(update.result);
      break;
  }
};
```

**Implementation:**
- Use **Supabase Realtime** or **Socket.io**
- Add `streamingMode` flag to `AgentTask`
- Agents emit progress events during execution
- Router broadcasts events to connected clients

**Benefits:**
- Better UX (users see progress)
- Cancellable long-running tasks
- Live AI response streaming (like ChatGPT)

---

### 2. Multi-Agent Collaboration

**Current Problem:**
- Agents work in isolation
- Complex tasks require multiple API calls
- No agent-to-agent communication

**Solution:**
Allow agents to call other agents during execution:

```typescript
// Ghost evaluator can call Best Interest Engine
async function executeGhostEvaluator(task: AgentTask) {
  const ghostResult = await ghostAPI(task.payload.prompt);
  
  // If confidence is low, escalate to Best Interest Engine
  if (ghostResult.confidence < 50 && task.domain === 'family-law') {
    const bestInterestTask: AgentTask = {
      id: `${task.id}_escalated`,
      origin: 'ghost-evaluator',
      targetAgents: ['best-interest-engine'],
      domain: 'family-law',
      kind: 'evaluation',
      priority: 'high',
      payload: {
        // ... transform Ghost inputs to Best Interest format
      },
    };
    
    // Call Best Interest Engine
    const refinedResult = await routeAgentTask(bestInterestTask);
    return refinedResult;
  }
  
  return ghostResult;
}
```

**Collaboration Patterns:**

#### **A. Sequential Pipeline**
```
User Request → Ghost → Best Interest → Legal Brief Generator → Result
```

#### **B. Parallel Execution**
```
User Request → [Ghost, Best Interest, Risk Analyzer] → Merge Results
```

#### **C. Voting/Consensus**
```
User Request → [Agent A, Agent B, Agent C] → Vote on Result → Final Answer
```

#### **D. Escalation**
```
Fast Agent (low confidence) → Escalate to Deep Reasoning Agent → Result
```

**Implementation:**
- Add `callAgent()` helper function
- Track agent call chain in trace
- Prevent infinite loops (max depth = 5)
- Add `collaboration` metadata to tasks

**Benefits:**
- More accurate results (agents can specialize)
- Handle complex multi-step workflows
- Automatic quality improvement (escalation)

---

### 3. Task Queueing System

**Current Problem:**
- All tasks execute immediately
- No rate limiting
- Can't handle 1000+ simultaneous requests

**Solution:**
Implement Redis-based task queue:

```typescript
// Queue architecture
┌─────────────┐
│   Client    │
└──────┬──────┘
       │ POST /api/agent-router
       ▼
┌─────────────────┐
│   API Handler   │
│  (validates)    │
└──────┬──────────┘
       │ Enqueue task
       ▼
┌─────────────────┐
│  Redis Queue    │
│  (FIFO/Priority)│
└──────┬──────────┘
       │ Dequeue
       ▼
┌─────────────────┐
│  Worker Pool    │
│  (5-10 workers) │
└──────┬──────────┘
       │ Execute task
       ▼
┌─────────────────┐
│  Agent Router   │
│  (current v1.0) │
└─────────────────┘
```

**Priority Queues:**
- `critical`: Execute immediately (bypass queue)
- `high`: Top of queue
- `normal`: Standard FIFO
- `low`: Background tasks

**Implementation:**
```typescript
import { Queue } from 'bullmq';

const agentQueue = new Queue('agentos-tasks', {
  connection: {
    host: process.env.REDIS_HOST,
    port: 6379,
  },
});

// Enqueue task
export async function enqueueAgentTask(task: AgentTask) {
  const job = await agentQueue.add('agent-task', task, {
    priority: priorityToNumber(task.priority),
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  });
  
  return {
    taskId: task.id,
    jobId: job.id,
    status: 'queued',
    estimatedWait: await getQueueWaitTime(),
  };
}

// Worker processes queue
const worker = new Worker('agentos-tasks', async (job) => {
  const task = job.data as AgentTask;
  return await routeAgentTask(task);
});
```

**Benefits:**
- Handle 10,000+ requests/second
- Graceful degradation under load
- Retry failed tasks automatically
- Rate limiting per user

---

### 4. Agent Marketplace

**Current Problem:**
- Only 4 built-in agents
- No extensibility
- Can't add custom agents without code changes

**Solution:**
Create agent plugin system:

```typescript
// Third-party developer creates agent
export const customLegalAgent: AgentDescriptor = {
  id: 'custom-legal-analyzer',
  name: 'Legal Document Analyzer',
  description: 'Extracts key clauses from legal contracts',
  supportedKinds: ['analysis'],
  supportedDomains: ['legal'],
  isHumanInLoop: false,
  endpoint: 'https://my-agent-api.com/analyze',
  apiKey: process.env.CUSTOM_AGENT_API_KEY,
  capabilities: [
    'Contract clause extraction',
    'Risk identification',
    'Compliance checking',
  ],
  version: '1.2.0',
  pricing: {
    model: 'per-task',
    costPerTask: 0.50, // $0.50 per task
    revSharePercent: 30, // 30% to TiQology
  },
};

// Developer submits agent to marketplace
POST /api/agentos/marketplace/submit
{
  "agent": customLegalAgent,
  "testResults": { /* validation data */ }
}
```

**Marketplace Features:**
- **Browse agents** (by category, rating)
- **Install agents** (add to user's AgentOS)
- **Rate & review** agents
- **Revenue sharing** (developers earn from agent usage)
- **Versioning** (agents can be updated)
- **Testing sandbox** (try before installing)

**Agent Approval Process:**
1. Developer submits agent
2. TiQology reviews (security, quality)
3. Automated testing (100 test cases)
4. Approval → Published to marketplace
5. Users can install and use

**Benefits:**
- Unlimited agent ecosystem
- Community-driven innovation
- Developers monetize their agents
- TiQology earns revenue share

---

### 5. Workflow Automation (No-Code Pipelines)

**Current Problem:**
- Multi-step workflows require custom code
- No visual workflow builder
- Hard to maintain complex agent chains

**Solution:**
Visual workflow builder UI:

```yaml
# Example workflow: "Best Interest Analysis Pipeline"
name: "Best Interest Full Analysis"
trigger:
  type: "manual" # or "scheduled", "webhook"

steps:
  - id: "step1"
    agent: "ghost-evaluator"
    input:
      prompt: "{{ user.input }}"
      model: "chat-model"
    output: "ghostResult"
  
  - id: "step2"
    agent: "best-interest-engine"
    condition: "{{ ghostResult.score < 70 }}"
    input:
      parentingPlan: "{{ user.parentingPlan }}"
      communication: "{{ user.communication }}"
      incidents: "{{ user.incidents }}"
      childProfile: "{{ user.childProfile }}"
    output: "bestInterestResult"
  
  - id: "step3"
    agent: "legal-brief-generator"
    input:
      evaluation: "{{ bestInterestResult }}"
      templateType: "court-filing"
    output: "legalBrief"
  
  - id: "step4"
    agent: "email-sender"
    input:
      to: "{{ user.email }}"
      subject: "Your Best Interest Analysis"
      body: "{{ legalBrief.content }}"
      attachments: ["{{ legalBrief.pdf }}"]
```

**Workflow UI Features:**
- Drag-and-drop agent nodes
- Connect agents with arrows
- Conditional logic (if/else)
- Variable mapping (pass data between agents)
- Loops (retry until success)
- Parallel branches
- Error handling (catch/fallback)

**Implementation:**
- Use **Temporal.io** or **n8n** workflow engine
- Store workflows in database (`workflows` table)
- Execute workflows via `/api/workflows/:id/execute`

**Benefits:**
- Non-technical users can build workflows
- Reusable templates (legal, sports, business)
- Version control (workflow history)
- Shareable (export/import workflows)

---

### 6. Advanced Monitoring & Analytics

**Current Problem:**
- Basic execution traces
- No real-time dashboard
- Hard to debug issues
- No performance metrics

**Solution:**
Build AgentOS Dashboard:

#### **A. Live Agent Status**
```
┌─────────────────────────────────────┐
│  AgentOS Live Dashboard             │
├─────────────────────────────────────┤
│  Ghost Evaluator      ● ACTIVE      │
│  - Current tasks: 12                │
│  - Avg response: 8.2s               │
│  - Success rate: 98.5%              │
│                                     │
│  Best Interest        ● ACTIVE      │
│  - Current tasks: 3                 │
│  - Avg response: 15.7s              │
│  - Success rate: 99.1%              │
│                                     │
│  Devin Builder        ⚠ DEGRADED    │
│  - Current tasks: 0                 │
│  - Avg response: N/A                │
│  - Last error: Timeout (2m ago)     │
└─────────────────────────────────────┘
```

#### **B. Task Queue Visualization**
```
┌─────────────────────────────────────┐
│  Task Queue (25 tasks)              │
├─────────────────────────────────────┤
│  🔴 CRITICAL   (2)   ▶ Processing   │
│  🟠 HIGH       (8)   ⏸ Queued       │
│  🟡 NORMAL     (12)  ⏸ Queued       │
│  🟢 LOW        (3)   ⏸ Queued       │
│                                     │
│  Est. wait time: 45 seconds         │
└─────────────────────────────────────┘
```

#### **C. Performance Charts**
```
┌─────────────────────────────────────┐
│  AgentOS Performance (Last 7 Days)  │
├─────────────────────────────────────┤
│  Total Tasks: 12,547                │
│  Success Rate: 98.2%                │
│  Avg Response Time: 9.4s            │
│                                     │
│  [Chart: Tasks per Day]             │
│  [Chart: Response Time Trend]       │
│  [Chart: Error Rate]                │
└─────────────────────────────────────┘
```

**Metrics to Track:**
- Tasks processed (total, per agent, per user)
- Response times (p50, p95, p99)
- Success/failure rates
- Queue depth (current, max, avg)
- Agent uptime
- API costs ($ per task, per agent)
- User satisfaction (feedback scores)

**Alerting Rules:**
- Agent down for > 5 minutes → Page on-call
- Queue depth > 1000 → Notify team
- Error rate > 5% → Investigate
- Response time > 30s (p95) → Optimize

**Implementation:**
- Use **Datadog** or **Grafana** for metrics
- Store metrics in **TimescaleDB** (time-series data)
- Build internal dashboard (Next.js + Recharts)

---

## New Agent Types (v2.0)

AgentOS v2.0 introduces **5 new specialized agents**:

### 7. Negotiator Agent

**Purpose:** Automatically negotiate with vendors on behalf of users

**Capabilities:**
- Send outreach emails to partners
- Parse email responses (AI-powered)
- Track deal status
- Auto-accept deals meeting criteria

**Example Task:**
```typescript
{
  id: 'negotiate_uber',
  targetAgents: ['negotiator-bot'],
  kind: 'ops',
  domain: 'travel',
  payload: {
    vendor: 'Uber',
    requestType: 'bulk-discount',
    userCount: 5000,
    desiredDiscount: 15, // percent
    terms: 'Exclusive partnership for TiQology users',
  }
}
```

**Workflow:**
1. Bot drafts email (AI-generated)
2. Sends to Uber partnerships team
3. Monitors inbox for response
4. Parses response (AI extracts deal terms)
5. If deal >= 15%, auto-accept
6. If deal < 15%, counter-offer
7. Notify user when deal secured

---

### 8. Analytics Agent

**Purpose:** Generate insights from user data

**Capabilities:**
- SQL query generation (AI-powered)
- Data visualization
- Trend analysis
- Anomaly detection

**Example Task:**
```typescript
{
  id: 'analyze_earnings',
  targetAgents: ['analytics-agent'],
  kind: 'analysis',
  domain: 'general',
  payload: {
    question: 'Which survey vendor has the highest completion rate?',
    dataSource: 'user_earnings',
  }
}
```

**Output:**
```json
{
  "answer": "Pollfish has the highest completion rate at 87%",
  "chart": "base64_image_data",
  "sql": "SELECT vendor, AVG(completion_rate) ...",
  "insights": [
    "Pollfish surveys are 23% shorter on average",
    "Users prefer surveys under 5 minutes"
  ]
}
```

### 9. Voice Agent

**Purpose:** Hands-free interaction with TiQology (driving, cooking, accessibility)

**Capabilities:**
- Speech-to-text (Whisper API)
- Text-to-speech (ElevenLabs or Google TTS)
- Natural language command processing
- Context-aware conversations
- Multi-turn dialogues

**Example Task:**
```typescript
{
  id: 'voice_evaluation',
  targetAgents: ['voice-agent', 'ghost-evaluator'],
  kind: 'evaluation',
  domain: 'family-law',
  payload: {
    audioInput: 'base64_audio_data', // User's voice recording
    command: 'evaluate', // Extracted intent
  }
}
```

**Workflow:**
1. User speaks: "Hey TiQ, evaluate this parenting plan..."
2. Voice agent transcribes audio (Whisper)
3. Extracts intent + parameters (GPT-4)
4. Routes to Ghost evaluator
5. Ghost returns evaluation
6. Voice agent speaks result (TTS)
7. User hears: "Your parenting plan scores 82 out of 100..."

**Voice Commands:**
- "Start evaluation"
- "Show my earnings"
- "Find missions near me"
- "What's my level?"
- "Share with [friend name]"

---

### 10. Collaboration Agent

**Purpose:** Real-time collaborative editing and teamwork

**Capabilities:**
- Real-time document syncing (Y.js CRDTs)
- Live cursor tracking
- Presence awareness (who's online)
- Comment threading
- Version control with restore

**Example Task:**
```typescript
{
  id: 'collab_session',
  targetAgents: ['collaboration-agent'],
  kind: 'workflow',
  domain: 'general',
  payload: {
    documentId: 'legal_eval_123',
    users: ['user_1', 'user_2', 'user_3'],
    permissions: {
      'user_1': 'admin',
      'user_2': 'editor',
      'user_3': 'viewer',
    },
  }
}
```

**Features:**
- Multiple users editing same document
- Live cursors (different colors per user)
- Conflict-free updates (CRDTs)
- Chat/comments on documents
- Activity log (who changed what when)

**Use Cases:**
- Legal teams collaborating on evaluations
- Families co-editing parenting plans
- Business teams building proposals

---

**Purpose:** Generate marketing content, social posts, emails

**Capabilities:**
- Blog post generation
- Social media posts (Twitter, LinkedIn)
- Email campaigns
- Ad copy

**Example Task:**
```typescript
{
  id: 'generate_blog',
  targetAgents: ['content-generator'],
  kind: 'build',
  domain: 'general',
  payload: {
    contentType: 'blog-post',
    topic: 'How TiQology helps families navigate co-parenting',
    tone: 'empathetic',
    length: 1500, // words
    keywords: ['co-parenting', 'best interest', 'family law'],
  }
}
```

---

## API Changes (v1.0 → v2.0)

### New Endpoints

#### `POST /api/agentos/stream` (WebSocket upgrade)
Open WebSocket connection for real-time task execution

#### `GET /api/agentos/queue/status`
Get current queue depth and estimated wait time

#### `POST /api/agentos/workflows`
Create new workflow

#### `GET /api/agentos/workflows/:id/execute`
Execute saved workflow

#### `GET /api/agentos/marketplace`
Browse available agents

#### `POST /api/agentos/marketplace/install`
Install third-party agent

#### `GET /api/agentos/analytics`
Get performance metrics

---

## Migration Path (v1.0 → v2.0)

### Backward Compatibility

**All v1.0 endpoints still work:**
- `POST /api/agent-router` (synchronous, no breaking changes)

**v2.0 features are opt-in:**
- Use `streamingMode: true` to enable WebSocket
- Use `collaborationMode: true` to enable multi-agent
- Use `queueTask: true` to enqueue (default: execute immediately)

### Migration Checklist

**For Existing Clients:**
1. ✅ No changes required (v1.0 API still works)
2. ✅ Optionally upgrade to WebSocket for streaming
3. ✅ Optionally enable multi-agent collaboration

**For AgentOS Codebase:**
1. Add WebSocket server (Socket.io or Supabase Realtime)
2. Add Redis for task queueing (BullMQ)
3. Add workflow engine (Temporal or custom)
4. Build marketplace UI + approval workflow
5. Build AgentOS dashboard
6. Add new agent types (Negotiator, Analytics, Content)

---

## Performance Targets (v2.0)

| Metric | v1.0 | v2.0 Target |
|--------|------|-------------|
| Max concurrent tasks | 10 | 1,000 |
| Task throughput | 100/min | 10,000/min |
| Avg response time (Ghost) | 8s | 6s (with caching) |
| Queue wait time (p95) | N/A | < 10s |
| Uptime | 99.5% | 99.9% |
| Error rate | 2% | < 0.5% |

---

## Success Metrics (v2.0 Launch)

**Technical:**
- ✅ WebSocket streaming working (< 100ms latency)
- ✅ Task queue handling 10,000 tasks/min
- ✅ 5+ third-party agents in marketplace
- ✅ 10+ workflow templates available
- ✅ AgentOS dashboard live

**Business:**
- ✅ 50% of users enable streaming mode
- ✅ 3+ third-party developers building agents
- ✅ 100+ users create custom workflows
- ✅ Agent marketplace generating revenue

---

## Timeline

**Week 11: Foundation**
- Set up WebSocket server
- Add Redis queue
- Build queue worker pool
- Test under load (10,000 tasks)

**Week 12: Features**
- Build agent marketplace UI
- Create workflow builder UI
- Add 3 new agents (Negotiator, Analytics, Content)
- Build AgentOS dashboard

**Week 13: Testing & Launch**
- Load testing (1M tasks)
- Security audit
- Beta test with 100 users
- Public v2.0 launch

---

**AgentOS v2.0 = The world's most advanced multi-agent orchestration platform. 🚀**

**— Devin + Super Chat**
