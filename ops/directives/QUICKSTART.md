# 🤖 Devin Ops Protocol - Quick Start Guide

**Turn Devin into TiQology's autonomous build, deploy, and telemetry agent in 5 steps.**

---

## 📋 What You Get

After setup, Devin will:
- ✅ **Auto-detect** new directives in `/ops/directives/pending/`
- ✅ **Execute end-to-end** (branch → code → test → commit → PR)
- ✅ **Log everything** to TiQology Core DB + local files
- ✅ **Report telemetry** to AgentOS dashboard
- ✅ **Self-heal** with retry logic and error recovery

---

## 🚀 5-Minute Setup

### Step 1: Apply Database Migration

```bash
# Connect to your Supabase database
psql $DATABASE_URL -f docs/migrations/003_devin_operations_telemetry.sql

# Verify tables created
psql $DATABASE_URL -c "\dt devin_*"
```

**Expected output:**
```
devin_logs
devin_operation_steps
devin_operations
devin_telemetry
```

---

### Step 2: Create Directive Folders

```bash
# Create folder structure
mkdir -p ops/directives/{pending,in-progress,completed,failed,blocked}

# Verify structure
tree ops/directives
```

**Expected output:**
```
ops/directives/
├── pending/       ← Drop new directives here
├── in-progress/   ← Devin moves files here during execution
├── completed/     ← Successful directives
├── failed/        ← Failed directives (check logs)
├── blocked/       ← Blocked directives (manual intervention needed)
└── templates/     ← Pre-built directive templates
```

---

### Step 3: Initialize Devin Ops Service

Add to your application startup (e.g., `instrumentation.ts` or `server.ts`):

```typescript
import { initializeDevinOps } from './lib/devinOpsService';

// Initialize Devin when app starts
async function startup() {
  await initializeDevinOps();
  console.log('✅ Devin Ops Protocol running');
}

startup();
```

**Or run standalone:**

```bash
# Create a startup script
cat > start-devin.ts << 'EOF'
import { initializeDevinOps } from './lib/devinOpsService';
initializeDevinOps();
EOF

# Run it
npx tsx start-devin.ts
```

---

### Step 4: Test with Sample Directive

```bash
# Copy sample directive to pending folder
cp ops/directives/samples/voice-commands-sample.yaml \
   ops/directives/pending/FEAT-2025-01-15-VOICE-COMMANDS.yaml

# Devin will detect it within 60 seconds
# Watch the logs
tail -f ops/logs/devin-$(date +%Y-%m-%d).log
```

**What happens:**
1. Devin detects the file (60s max)
2. Parses the YAML directive
3. Executes each step sequentially
4. Logs to database + file
5. Moves directive to `completed/` or `failed/`
6. Creates PR on GitHub

---

### Step 5: Monitor Operations

**Via Database:**
```sql
-- Get recent operations
SELECT 
  directive_id,
  directive_title,
  status,
  execution_time_ms,
  pr_url
FROM devin_operations
ORDER BY created_at DESC
LIMIT 10;

-- Get Devin's workload
SELECT * FROM get_devin_workload();

-- Get success rate (last 7 days)
SELECT * FROM get_devin_success_rate(7);
```

**Via Logs:**
```bash
# Real-time logs
tail -f ops/logs/devin-$(date +%Y-%m-%d).log

# Error logs only
tail -f ops/logs/devin-errors-$(date +%Y-%m-%d).log

# Filter by operation
cat ops/logs/devin-*.log | grep "operation_id:YOUR_ID"
```

**Via AgentOS:**
- Open AgentOS dashboard
- Navigate to **Agents** → **devin-builder**
- View real-time telemetry and event log

---

## 📝 Creating Your First Directive

### Option 1: Use a Template

```bash
# Copy template
cp ops/directives/templates/feature-directive.yaml \
   ops/directives/pending/FEAT-2025-01-15-MY-FEATURE.yaml

# Edit the file
vim ops/directives/pending/FEAT-2025-01-15-MY-FEATURE.yaml

# Fill in:
# - id: "FEAT-2025-01-15-MY-FEATURE"
# - title: "Implement My Feature"
# - objectives: [list of goals]
# - execution_steps: [step-by-step actions]
# - validation: [tests to verify success]

# Save and exit
# Devin will auto-detect and execute
```

### Option 2: Minimal Example

```yaml
id: "FEAT-2025-01-15-STATUS-API"
title: "Create TiQology Status API"
priority: "normal"
status: "pending"
created_at: "2025-01-15T12:00:00Z"
created_by: "human"
assigned_to: "devin-builder"

context:
  description: "Create a simple /api/status endpoint that returns TiQology health status"
  background: "Testing Devin Ops Protocol"

objectives:
  - "Create API endpoint"
  - "Write test"
  - "Create PR"

execution_steps:
  - step: 1
    action: "Create feature branch"
    command: "git checkout -b feature/status-api"
  
  - step: 2
    action: "Create API endpoint"
    files_to_create:
      - "app/api/status/route.ts"
  
  - step: 3
    action: "Commit and push"
    command: "git add . && git commit -m 'feat: add TiQology status endpoint' && git push origin feature/status-api"

validation:
  - criterion: "Endpoint returns 200"
    test_command: "curl http://localhost:3000/api/status"

telemetry:
  log_to_db: true
  log_to_agentos: true
  notify_on_completion: true
```

---

## 🎯 Common Use Cases

### Bug Fix
```bash
cp ops/directives/templates/bugfix-directive.yaml \
   ops/directives/pending/BUG-2025-01-15-0042.yaml
```

### Database Migration
```bash
cp ops/directives/templates/migration-directive.yaml \
   ops/directives/pending/MIG-2025-01-15-0003.yaml
```

### Deployment
```bash
cp ops/directives/templates/deployment-directive.yaml \
   ops/directives/pending/DEPLOY-2025-01-15-0001.yaml
```

---

## 🔧 Configuration

### Environment Variables

```bash
# Disable Devin Ops (default: enabled)
export DEVIN_OPS_ENABLED=false

# Change watcher interval (default: 60000ms = 60s)
export DEVIN_WATCHER_INTERVAL_MS=30000

# Set log level (default: info)
export DEVIN_LOG_LEVEL=debug
```

### Programmatic Configuration

```typescript
import { DevinOpsService } from './lib/devinOpsService';

// Customize before initialization
DevinOpsService.config.WATCHER_INTERVAL_MS = 30000; // 30 seconds
DevinOpsService.config.ENABLED = true;

await DevinOpsService.initialize();
```

---

## 🐛 Troubleshooting

### Devin isn't detecting directives

**Check:**
1. Is Devin Ops running? `ps aux | grep devin`
2. Is the file in `/ops/directives/pending/`?
3. Is the file extension `.yaml` or `.yml`?
4. Check logs: `tail -f ops/logs/devin-$(date +%Y-%m-%d).log`

**Solution:**
```bash
# Restart Devin Ops
pkill -f devinOpsService
npx tsx start-devin.ts
```

---

### Directive fails immediately

**Check:**
1. YAML syntax: `yamllint ops/directives/pending/YOUR-FILE.yaml`
2. Required fields: `id`, `title`, `execution_steps`
3. Error logs: `tail -f ops/logs/devin-errors-$(date +%Y-%m-%d).log`

**Solution:**
```bash
# Validate YAML
cat ops/directives/failed/YOUR-FILE.yaml | yq eval

# Check database for error details
psql $DATABASE_URL -c "
  SELECT error_message, error_stack 
  FROM devin_operations 
  WHERE directive_id = 'YOUR-DIRECTIVE-ID';
"
```

---

### Database connection fails

**Check:**
```bash
# Verify DATABASE_URL
echo $DATABASE_URL

# Test connection
psql $DATABASE_URL -c "SELECT 1;"

# Verify tables exist
psql $DATABASE_URL -c "\dt devin_*"
```

**Solution:**
```bash
# Re-apply migration
psql $DATABASE_URL -f docs/migrations/003_devin_operations_telemetry.sql
```

---

## 📊 Monitoring Dashboard

### Key Metrics to Watch

1. **Success Rate**: Should be > 90%
   ```sql
   SELECT * FROM get_devin_success_rate(7);
   ```

2. **Avg Execution Time**: Should be < 5 minutes
   ```sql
   SELECT AVG(execution_time_ms) FROM devin_operations WHERE status = 'completed';
   ```

3. **Error Rate**: Should be < 5%
   ```sql
   SELECT 
     COUNT(*) FILTER (WHERE status = 'failed') * 100.0 / COUNT(*) as error_rate
   FROM devin_operations;
   ```

---

## 🚨 Emergency Stop

```bash
# Stop Devin immediately
pkill -f devinOpsService

# Or set env var
export DEVIN_OPS_ENABLED=false

# Move all pending directives to blocked
mv ops/directives/pending/* ops/directives/blocked/
```

---

## 📚 Next Steps

- **Read the full spec**: `ops/directives/README.md`
- **View database schema**: `docs/CORE_DB_SCHEMA.md`
- **Explore templates**: `ops/directives/templates/`
- **Check samples**: `ops/directives/samples/`
- **AgentOS integration**: `docs/AGENTOS_V2_SPEC.md`

---

## 🎉 Success Checklist

- [ ] Database migration applied (`devin_*` tables exist)
- [ ] Directive folders created (`ops/directives/`)
- [ ] Devin Ops service initialized (startup logs show "DEVIN OPS PROTOCOL v2.0")
- [ ] Sample directive executed successfully
- [ ] Logs writing to `/ops/logs/`
- [ ] Database records in `devin_operations` table
- [ ] AgentOS showing devin-builder as active
- [ ] PR created automatically by Devin

**When all boxes are checked, Devin is fully autonomous! 🎯**

---

## 💡 Pro Tips

1. **Use priorities wisely**: `critical` > `high` > `normal` > `low`
2. **Write clear objectives**: Helps Devin understand the goal
3. **Add validation tests**: Ensures quality before PR
4. **Monitor logs daily**: Catch issues early
5. **Review failed directives**: Learn and improve
6. **Keep templates updated**: Reflect your workflow

---

**Questions?** Check `ops/directives/README.md` or contact the engineering team.
