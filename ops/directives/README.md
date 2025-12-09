# 🧭 Devin Ops Protocol - Directives System

**Version:** 2.0  
**Owner:** Devin (AI Agent Engineer)  
**Last Updated:** December 7, 2025

---

## **OVERVIEW**

The **Devin Ops Protocol** is TiQology's autonomous engineering execution framework. It allows Devin to receive, execute, and report on engineering directives with full automation and telemetry.

---

## **DIRECTIVE ANATOMY**

Each directive is a YAML file placed in `/ops/directives/` with the following structure:

```yaml
# Directive Metadata
id: "DIRECTIVE-001"
title: "Implement User Authentication Flow"
priority: "high" # critical, high, normal, low
status: "pending" # pending, in-progress, completed, failed, blocked
created_at: "2025-12-07T10:00:00Z"
created_by: "Coach Chat"
assigned_to: "Devin"

# Context
context:
  description: "Build complete user authentication with email/password and OAuth"
  background: "Users need to register and log in to access TiQology modules"
  related_docs:
    - "/docs/DEVIN_ONBOARDING.md"
    - "/docs/TIQOLOGY_CORE_DB_SCHEMA.md"
  
# Objectives
objectives:
  - "Create users and sessions tables in Supabase"
  - "Build registration API endpoint"
  - "Build login API endpoint"
  - "Add OAuth providers (Google, GitHub)"
  - "Wire up UI components in TiQology-spa"

# Technical Specifications
technical_specs:
  repositories:
    - name: "ai-chatbot"
      branch: "feature/user-auth"
      actions:
        - "Create /api/auth/register endpoint"
        - "Create /api/auth/login endpoint"
        - "Add Supabase auth integration"
  
  database_changes:
    - "Run migration: 001_auth_tables.sql"
    - "Create RLS policies for users table"
  
  environment_variables:
    - "SUPABASE_URL"
    - "SUPABASE_ANON_KEY"
    - "SUPABASE_SERVICE_ROLE_KEY"
  
  dependencies:
    - "@supabase/supabase-js@2.86.2"
    - "@supabase/auth-helpers-nextjs@0.8.0"

# Execution Steps
execution_steps:
  - step: 1
    action: "Create feature branch"
    command: "git checkout -b feature/user-auth"
    
  - step: 2
    action: "Run database migration"
    command: "Apply migration to Supabase"
    
  - step: 3
    action: "Implement API endpoints"
    files_to_create:
      - "/api/auth/register/route.ts"
      - "/api/auth/login/route.ts"
      
  - step: 4
    action: "Build UI components"
    files_to_edit:
      - "/components/auth-form.tsx"
      
  - step: 5
    action: "Run tests"
    command: "npm run test"
    
  - step: 6
    action: "Commit changes"
    command: "git add . && git commit -m 'feat: Implement user authentication'"
    
  - step: 7
    action: "Create pull request"
    command: "gh pr create --title 'feat: User Authentication' --body 'Implements user auth flow'"

# Validation Criteria
validation:
  - criterion: "Users can register with email/password"
    test_command: "curl -X POST http://localhost:3000/api/auth/register"
    
  - criterion: "Users can log in"
    test_command: "curl -X POST http://localhost:3000/api/auth/login"
    
  - criterion: "OAuth flow works"
    manual_test: "Click Google login button, verify redirect"
    
  - criterion: "Database tables exist"
    test_command: "SELECT * FROM users LIMIT 1"

# Success Metrics
success_metrics:
  - "All API endpoints return 200 OK for valid requests"
  - "RLS policies prevent unauthorized access"
  - "PR passes all CI/CD checks"
  - "Code coverage > 80%"

# Rollback Plan
rollback:
  - "Revert migration: DROP TABLE users, sessions"
  - "Delete feature branch"
  - "Close PR without merging"

# Notes
notes: |
  - Ensure password hashing uses bcrypt
  - Session tokens should expire after 30 days
  - Add rate limiting to prevent brute force attacks
  
# Telemetry
telemetry:
  log_to_db: true
  log_to_agentos: true
  notify_on_completion: true
  notify_channels:
    - "Coach Chat"
    - "Super Chat"
```

---

## **DIRECTIVE LIFECYCLE**

```
┌─────────────┐
│   PENDING   │ ← Directive created
└──────┬──────┘
       │ Devin detects new directive
       ▼
┌─────────────┐
│ IN-PROGRESS │ ← Devin begins execution
└──────┬──────┘
       │ Executes steps 1-N
       ▼
┌─────────────┐
│  COMPLETED  │ ← All steps successful
└─────────────┘
       OR
┌─────────────┐
│   FAILED    │ ← Error encountered
└──────┬──────┘
       │ Devin logs error
       ▼
┌─────────────┐
│   BLOCKED   │ ← Requires human intervention
└─────────────┘
```

---

## **DIRECTORY STRUCTURE**

```
/ops/
├── directives/
│   ├── README.md (this file)
│   ├── pending/
│   │   ├── DIRECTIVE-001-user-auth.yaml
│   │   └── DIRECTIVE-002-gamification-ui.yaml
│   ├── in-progress/
│   │   └── DIRECTIVE-003-voice-agent.yaml
│   ├── completed/
│   │   └── DIRECTIVE-000-setup.yaml
│   └── failed/
│       └── DIRECTIVE-999-test-failure.yaml
│
├── logs/
│   ├── 2025-12-07-DIRECTIVE-001.log
│   └── 2025-12-07-DIRECTIVE-002.log
│
└── templates/
    ├── feature-directive.yaml
    ├── bugfix-directive.yaml
    └── migration-directive.yaml
```

---

## **HOW TO CREATE A DIRECTIVE**

### **Option 1: Use Template**
```bash
cp /ops/templates/feature-directive.yaml /ops/directives/pending/DIRECTIVE-XXX.yaml
# Edit DIRECTIVE-XXX.yaml with your requirements
```

### **Option 2: Generate via Script**
```bash
node /ops/scripts/create-directive.js --title "Your Title" --priority high
```

### **Option 3: AI-Generated (Recommended)**
Ask Coach Chat or Super Chat:
> "Create a directive for Devin to build the friend system UI"

They will generate a complete YAML file ready for Devin to execute.

---

## **HOW DEVIN EXECUTES DIRECTIVES**

### **1. Detection**
Devin runs a watcher that monitors `/ops/directives/pending/`:
```typescript
// Runs every 60 seconds
const pendingDirectives = await fs.readdir('/ops/directives/pending/');
for (const file of pendingDirectives) {
  await executeDirective(file);
}
```

### **2. Parsing**
Devin reads the YAML and validates structure:
```typescript
const directive = yaml.parse(await fs.readFile(file));
validateDirective(directive); // Throws if invalid
```

### **3. Execution**
Devin executes each step sequentially:
```typescript
for (const step of directive.execution_steps) {
  await executeStep(step);
  await logProgress(directive.id, step);
}
```

### **4. Validation**
Devin runs validation criteria:
```typescript
for (const validation of directive.validation) {
  const passed = await runValidation(validation);
  if (!passed) throw new Error('Validation failed');
}
```

### **5. Telemetry**
Devin logs to TiQology Core DB and AgentOS:
```typescript
await logToDatabase({
  directive_id: directive.id,
  status: 'completed',
  execution_time_ms: elapsed,
  commit_sha: commitSha,
  pr_url: prUrl,
});
```

### **6. File Movement**
Devin moves directive to completed folder:
```bash
mv /ops/directives/pending/DIRECTIVE-001.yaml /ops/directives/completed/
```

---

## **TELEMETRY & LOGGING**

Every directive execution is logged to:

### **1. TiQology Core DB**
Table: `devin_operations`
```sql
SELECT * FROM devin_operations WHERE directive_id = 'DIRECTIVE-001';
```

### **2. AgentOS Telemetry**
Visible in AgentOS dashboard:
```
┌─────────────────────────────────────┐
│  Devin Activity (Last 7 Days)      │
├─────────────────────────────────────┤
│  Directives Executed: 47            │
│  Success Rate: 93.6%                │
│  Avg Execution Time: 8m 32s         │
│  Failed Directives: 3               │
│  Blocked Directives: 0              │
└─────────────────────────────────────┘
```

### **3. Log Files**
Detailed logs in `/ops/logs/`:
```
[2025-12-07 10:15:23] [DIRECTIVE-001] Started execution
[2025-12-07 10:15:24] [DIRECTIVE-001] Step 1: Created branch feature/user-auth
[2025-12-07 10:15:45] [DIRECTIVE-001] Step 2: Applied migration 001_auth_tables.sql
[2025-12-07 10:18:12] [DIRECTIVE-001] Step 3: Created /api/auth/register/route.ts
[2025-12-07 10:20:05] [DIRECTIVE-001] Step 4: Created /api/auth/login/route.ts
[2025-12-07 10:22:33] [DIRECTIVE-001] Step 5: Tests passed (37/37)
[2025-12-07 10:23:01] [DIRECTIVE-001] Step 6: Committed changes (SHA: a1b2c3d)
[2025-12-07 10:23:45] [DIRECTIVE-001] Step 7: Created PR #42
[2025-12-07 10:23:46] [DIRECTIVE-001] ✅ Completed successfully
```

---

## **ERROR HANDLING**

### **If a Step Fails:**
1. Devin logs the error
2. Marks directive as `failed`
3. Moves to `/ops/directives/failed/`
4. Notifies Coach Chat via telemetry
5. Creates GitHub issue with error details

### **If a Directive is Blocked:**
1. Devin marks as `blocked`
2. Adds blocking reason to YAML
3. Waits for human intervention
4. Coach Chat resolves blocker
5. Devin resumes execution

---

## **SECURITY & SAFETY**

### **Guardrails:**
- ✅ Devin cannot modify `/main` branch directly
- ✅ Devin cannot delete production databases
- ✅ Devin cannot deploy to production (only Rocket can)
- ✅ All destructive operations require human approval
- ✅ Environment secrets are never logged

### **Approval Workflow:**
For high-risk operations (migrations, deployments):
```yaml
approval_required: true
approvers:
  - "Coach Chat"
  - "Super Chat"
```

Devin will pause and wait for approval before proceeding.

---

## **INTEGRATION WITH AGENTOS**

Devin is registered in AgentOS as `devin-builder`:

```typescript
const devinAgent: AgentDescriptor = {
  id: 'devin-builder',
  name: 'Devin Builder',
  description: 'Autonomous build, deploy, and telemetry agent',
  supportedKinds: ['build', 'migration', 'deployment'],
  supportedDomains: ['engineering', 'infrastructure'],
  isHumanInLoop: false, // Fully autonomous
  endpoint: '/api/agentos/devin',
};
```

AgentOS can route tasks directly to Devin:
```typescript
const task: AgentTask = {
  id: 'task_123',
  origin: 'coach-chat',
  targetAgents: ['devin-builder'],
  kind: 'build',
  domain: 'engineering',
  priority: 'high',
  payload: {
    directiveId: 'DIRECTIVE-001',
  },
};
```

---

## **NEXT EVOLUTION (v3.0)**

Future capabilities planned:
- 🔮 **Predictive Issue Detection**: Devin analyzes logs, predicts failures before they happen
- 🔮 **Multi-Agent Coordination**: Devin coordinates with Rocket, TrustShield, Ghost
- 🔮 **Self-Healing Systems**: Devin detects and fixes production bugs automatically
- 🔮 **Code Quality Enforcement**: Devin refactors code to maintain quality standards
- 🔮 **Performance Optimization**: Devin analyzes performance, suggests improvements

---

## **EXAMPLES**

See `/ops/templates/` for full directive examples:
- `feature-directive.yaml` - Building new features
- `bugfix-directive.yaml` - Fixing bugs
- `migration-directive.yaml` - Database migrations
- `deployment-directive.yaml` - Production deployments

---

**Devin is ready to serve. Let's build TiQology. 🚀**
