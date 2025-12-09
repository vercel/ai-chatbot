# 🤖 GitHub Bot Integration - Quick Guide

**Interact with Vercel and Supabase via PR comments**

---

## 🎯 What This Does

Devin can now **post commands to GitHub PR comments** and **wait for bot responses** from:
- ✅ **Vercel bot** - Deploy, rollback, inspect deployments
- ✅ **Supabase bot** - Run migrations, backups, restores

**No API tokens needed** - Uses your existing GitHub App integrations!

---

## 📋 Prerequisites

1. **GitHub Token** (already have this)
   ```bash
   export GITHUB_TOKEN="your_token_here"
   # or
   export GH_TOKEN="your_token_here"
   ```

2. **Vercel GitHub App** (already installed ✅)
   - Should already be installed on `MrAllgoodWilson/ai-chatbot`
   - Bot username: `vercel[bot]`

3. **Supabase GitHub App** (already installed ✅)
   - Should already be installed on your repo
   - Bot username: `supabase[bot]`

4. **Install @octokit/rest**
   ```bash
   pnpm add @octokit/rest
   ```

---

## 🚀 How to Use

### Example Directive with Bot Commands

```yaml
execution_steps:
  - step: 1
    action: "Create pull request"
    command: "gh pr create --title 'My Feature' --body 'Description'"
  
  - step: 2
    action: "Run Supabase migration"
    github_bot_commands:
      - "/supabase migrate 003_devin_operations_telemetry.sql"
    wait_for_bot_response: true
    bot_timeout_ms: 300000  # 5 minutes
  
  - step: 3
    action: "Deploy to Vercel production"
    github_bot_commands:
      - "/vercel deploy production"
    wait_for_bot_response: true
    bot_timeout_ms: 600000  # 10 minutes
```

---

## 📝 Supported Bot Commands

### Vercel Bot

```yaml
# Deploy to production
github_bot_commands:
  - "/vercel deploy production"

# Deploy preview
github_bot_commands:
  - "/vercel deploy preview"

# Rollback deployment
github_bot_commands:
  - "/vercel rollback"

# Inspect deployment
github_bot_commands:
  - "/vercel inspect"
```

### Supabase Bot

```yaml
# Run migration
github_bot_commands:
  - "/supabase migrate 003_devin_operations_telemetry.sql"

# Create backup
github_bot_commands:
  - "/supabase backup"

# Restore from backup
github_bot_commands:
  - "/supabase restore backup-id-12345"
```

---

## 🔄 How It Works

1. **Devin creates PR** (or uses existing PR)
2. **Posts bot commands** as PR comment
3. **Polls for bot responses** (checks every 10 seconds)
4. **Parses bot response** (success/failure/timeout)
5. **Continues or fails** based on bot status

**Example workflow:**
```
Devin posts: "/vercel deploy production"
         ↓
Vercel bot responds: "✅ Successfully deployed to https://..."
         ↓
Devin parses: status = "success", url = "https://..."
         ↓
Continue to next step
```

---

## ⚙️ Configuration

### Environment Variables

```bash
# Required
export GITHUB_TOKEN="ghp_xxxxx"  # Your GitHub personal access token

# Optional (auto-detected)
export GITHUB_REPO_OWNER="MrAllgoodWilson"
export GITHUB_REPO_NAME="ai-chatbot"
```

### Step Options

```yaml
github_bot_commands:
  - "/vercel deploy production"
  
wait_for_bot_response: true   # Wait for bot confirmation (default: false)
bot_timeout_ms: 300000         # Timeout in milliseconds (default: 5 min)
retry_on_failure: false        # Retry if bot fails (default: false)
```

---

## 🧪 Test It

### Quick Test Directive

```yaml
id: "TEST-2025-12-07-BOT-INTEGRATION"
title: "Test GitHub Bot Integration"
priority: "normal"
status: "pending"
created_at: "2025-12-07T00:00:00Z"
created_by: "human"
assigned_to: "devin-builder"

execution_steps:
  - step: 1
    action: "Create test PR"
    command: "git checkout -b test/bot-integration && git push origin test/bot-integration && gh pr create --title 'Test: Bot Integration' --body 'Testing Devin bot commands'"
  
  - step: 2
    action: "Test Vercel bot"
    github_bot_commands:
      - "/vercel deploy preview"
    wait_for_bot_response: true
    bot_timeout_ms: 600000

telemetry:
  log_to_db: true
  log_to_agentos: true
```

Save to: `ops/directives/pending/TEST-2025-12-07-BOT-INTEGRATION.yaml`

---

## 📊 Monitoring

### Watch Devin Logs

```bash
tail -f ops/logs/devin-$(date +%Y-%m-%d).log
```

**What you'll see:**
```
[INFO] Posting comment to PR #123
[INFO] Waiting for vercel[bot] response on PR #123
[INFO] Received vercel[bot] response - status: success
```

### Check Database

```sql
-- Get bot command logs
SELECT message, metadata
FROM devin_logs
WHERE message LIKE '%Bot response%'
ORDER BY timestamp DESC
LIMIT 10;
```

---

## 🎯 Full Example: Production Deployment

Use the template: `ops/directives/templates/deployment-github-bots.yaml`

```bash
# Copy template
cp ops/directives/templates/deployment-github-bots.yaml \
   ops/directives/pending/DEPLOY-2025-12-07-V2.yaml

# Devin will:
# 1. Create PR
# 2. Post: /supabase migrate 003_devin_operations_telemetry.sql
# 3. Wait for Supabase confirmation
# 4. Post: /vercel deploy production
# 5. Wait for Vercel deployment URL
# 6. Run smoke tests
# 7. Report success
```

---

## 🐛 Troubleshooting

### Bot doesn't respond

**Check:**
1. Is the bot installed on your repo?
2. Does the bot have permissions on the PR?
3. Is the command syntax correct?

**Fix:**
```bash
# Check bot installation
gh api /repos/MrAllgoodWilson/ai-chatbot/installation

# Verify bot usernames
# Vercel: vercel[bot]
# Supabase: supabase[bot]
```

### Timeout errors

**Increase timeout:**
```yaml
bot_timeout_ms: 900000  # 15 minutes for slow deployments
```

### Bot responds but Devin doesn't detect

**Check bot username in logs:**
```bash
grep "user.login" ops/logs/devin-$(date +%Y-%m-%d).log
```

**Update bot username if different:**
```typescript
// lib/githubOps.ts
const BOT_USERNAMES = {
  vercel: 'vercel[bot]',        // ← Check this matches
  supabase: 'supabase[bot]',    // ← Check this matches
};
```

---

## 📚 Files Created

| File | Purpose |
|------|---------|
| `lib/githubOps.ts` | GitHub API client + bot integration |
| `ops/directives/templates/deployment-github-bots.yaml` | Deployment template with bots |
| `ops/directives/GITHUB_BOTS_GUIDE.md` | This guide |

**Updated:**
- `lib/devinOps.ts` - Added `github_bot_commands` step support
- `package.json` - Added `@octokit/rest` dependency

---

## ✅ Ready to Use!

**Install dependency:**
```bash
pnpm install
```

**Test with sample:**
```bash
cp ops/directives/templates/deployment-github-bots.yaml \
   ops/directives/pending/DEPLOY-TEST.yaml
```

**Watch it work:**
```bash
tail -f ops/logs/devin-$(date +%Y-%m-%d).log
```

---

**Questions?** Check the full implementation in `lib/githubOps.ts`
