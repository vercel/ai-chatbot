# 🔧 TiQology Deployment - Quick Commands

**Use this for quick reference during deployment**

---

## Database Commands

### Generate New Migration
```bash
pnpm db:generate
```

### Apply Migrations (Local/Test)
```bash
pnpm db:migrate
```

### Open Drizzle Studio (Local DB Explorer)
```bash
pnpm db:studio
```

### Push Schema to Database (Development)
```bash
pnpm db:push
```

---

## Build Commands

### Development Build
```bash
pnpm dev
```

### Production Build (Local Test)
```bash
pnpm build
```

### Build with Migrations (What Vercel was trying to do)
```bash
pnpm build:with-migrate
```

### Start Production Server (After Build)
```bash
pnpm start
```

---

## Testing Commands

### Run All Tests
```bash
pnpm test
```

### Run Playwright E2E Tests
```bash
pnpm test:e2e
```

### Lint Code
```bash
pnpm lint
```

### Format Code
```bash
pnpm format
```

---

## Git Workflow

### Check Current Branch
```bash
git branch
```

### Check Status
```bash
git status
```

### Create New Branch
```bash
git checkout -b feature/your-feature-name
```

### Commit Changes
```bash
git add .
git commit -m "feat: your descriptive message"
```

### Push to Remote
```bash
git push origin your-branch-name
```

### Create Clean Branch for Deploy
```bash
git checkout -b deploy/production-$(date +%Y%m%d)
git push origin deploy/production-$(date +%Y%m%d)
```

---

## Vercel CLI Commands (Optional)

### Install Vercel CLI
```bash
pnpm add -g vercel
```

### Login to Vercel
```bash
vercel login
```

### Link Project
```bash
vercel link
```

### Deploy to Preview
```bash
vercel
```

### Deploy to Production
```bash
vercel --prod
```

### Check Deployment Status
```bash
vercel ls
```

### View Logs
```bash
vercel logs [deployment-url]
```

### Pull Environment Variables
```bash
vercel env pull
```

---

## Supabase SQL Commands (Run in SQL Editor)

### List All Tables
```sql
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;
```

### Check User Table
```sql
SELECT * FROM "User" ORDER BY id DESC LIMIT 10;
```

### Check Recent Chats
```sql
SELECT * FROM "Chat" ORDER BY "createdAt" DESC LIMIT 10;
```

### Check Recent Messages
```sql
SELECT * FROM "Message_v2" ORDER BY "createdAt" DESC LIMIT 10;
```

### Count Records
```sql
SELECT 
  'Users' as table_name, COUNT(*) as count FROM "User"
UNION ALL
SELECT 'Chats', COUNT(*) FROM "Chat"
UNION ALL
SELECT 'Messages', COUNT(*) FROM "Message_v2";
```

### Delete Test Data (CAUTION!)
```sql
-- Delete test guest users
DELETE FROM "User" WHERE email LIKE 'guest-%';

-- Delete old chats (older than 7 days)
DELETE FROM "Chat" WHERE "createdAt" < NOW() - INTERVAL '7 days';
```

---

## Environment Variable Commands

### Generate AUTH_SECRET
```bash
openssl rand -base64 32
```

### Check Environment Variables (Local)
```bash
cat .env.local
```

### Set Environment Variable (Local)
```bash
echo "VARIABLE_NAME=value" >> .env.local
```

---

## Debugging Commands

### Check Node Version
```bash
node --version
```

### Check pnpm Version
```bash
pnpm --version
```

### Check Dependencies
```bash
pnpm list
```

### Check for Outdated Packages
```bash
pnpm outdated
```

### Security Audit
```bash
pnpm audit
```

### Fix Security Issues
```bash
pnpm audit fix
```

### Clear Cache
```bash
pnpm store prune
rm -rf .next
rm -rf node_modules
pnpm install
```

---

## Useful Aliases (Add to ~/.bashrc or ~/.zshrc)

```bash
# TiQology shortcuts
alias tiq-dev="cd /workspaces/ai-chatbot && pnpm dev"
alias tiq-build="cd /workspaces/ai-chatbot && pnpm build"
alias tiq-deploy="cd /workspaces/ai-chatbot && git push && vercel --prod"
alias tiq-logs="vercel logs --follow"
alias tiq-clean="rm -rf .next node_modules && pnpm install"
```

---

## Emergency Commands

### Rollback Git Changes
```bash
git reset --hard HEAD
```

### Restore Specific File
```bash
git checkout HEAD -- path/to/file
```

### View Recent Commits
```bash
git log --oneline -10
```

### Revert to Previous Commit
```bash
git revert [commit-hash]
```

---

## Performance Testing

### Load Test (using autocannon)
```bash
npx autocannon -c 10 -d 30 https://your-domain.vercel.app
```

### Bundle Analysis
```bash
ANALYZE=true pnpm build
```

---

## Quick Status Checks

### Full System Check
```bash
echo "Node: $(node --version)"
echo "pnpm: $(pnpm --version)"
echo "Git Branch: $(git branch --show-current)"
echo "Git Status: $(git status --short)"
pnpm build --dry-run
```

### Database Connection Test (Local)
```bash
pnpm tsx -e "
import postgres from 'postgres';
const sql = postgres(process.env.POSTGRES_URL);
sql\`SELECT 1\`.then(() => console.log('✅ Connected')).catch(e => console.log('❌ Error:', e));
"
```

---

## Backup Commands

### Backup Database (Supabase Dashboard)
```
Supabase Dashboard → Settings → Database → Backups
Download PITR backup
```

### Backup Environment Variables
```bash
# In Vercel Dashboard
vercel env pull .env.backup
```

### Backup Code
```bash
git archive --format=zip --output=tiqology-backup-$(date +%Y%m%d).zip HEAD
```

---

**Keep this handy during deployment!** 🚀
