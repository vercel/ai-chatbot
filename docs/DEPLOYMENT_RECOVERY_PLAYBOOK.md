# 🚀 TiQology Deployment & Recovery Playbook

**Version**: 1.0  
**Last Updated**: December 22, 2025  
**Classification**: Emergency Operations Guide

---

## 📋 Quick Reference

| Action | Command | Time |
|--------|---------|------|
| **Emergency Rollback** | `./scripts/emergency-rollback.sh` | ~2 min |
| **Health Check** | `curl https://tiqology.vercel.app/api/health` | ~1 sec |
| **Deploy Production** | `pnpm deploy:production` | ~5 min |
| **View Logs** | `vercel logs tiqology-production` | instant |

---

## 🆘 Emergency Procedures

### 1. IMMEDIATE ROLLBACK (Production Down)

```bash
# Step 1: Trigger automated rollback
gh workflow run automated-rollback.yml \
  -f environment=production \
  -f reason="Production outage"

# Step 2: Verify health
curl https://tiqology.vercel.app/api/health

# Step 3: Check rollback status
gh run list --workflow=automated-rollback.yml --limit 1
```

**Expected Time**: 2-3 minutes  
**Success Criteria**: Health endpoint returns HTTP 200

### 2. PARTIAL FAILURE (High Error Rate)

```bash
# Step 1: Check metrics
curl https://tiqology.vercel.app/api/health | jq '.performance'

# Step 2: View recent errors
vercel logs --limit 50 --since 10m

# Step 3: If error rate > 10%, rollback
if [[ $(curl -s https://tiqology.vercel.app/api/health | jq -r '.performance.errorRate' | cut -d'%' -f1) -gt 10 ]]; then
  ./scripts/emergency-rollback.sh production
fi
```

### 3. DATABASE CONNECTION FAILURE

```bash
# Step 1: Check database health
psql $DATABASE_URL -c "SELECT 1"

# Step 2: Verify Supabase status
curl -I https://[your-project].supabase.co

# Step 3: Run migration repair if needed
pnpm db:migrate

# Step 4: Restart application
vercel redeploy --prod
```

---

## 🔄 Standard Deployment Procedures

### Production Deployment (Main Branch)

```bash
# Pre-deployment checklist
□ All tests passing
□ Code review approved
□ Staging validated
□ Database migrations ready
□ Environment variables verified

# Deploy command
git checkout main
git pull origin main
pnpm install
pnpm build
vercel --prod

# Post-deployment verification
curl https://tiqology.vercel.app/api/health
```

### Staging Deployment

```bash
git checkout develop
git pull origin develop
vercel --prod --scope staging
```

### Feature Branch Preview

```bash
git checkout feature/your-feature
git push origin feature/your-feature
# Preview URL automatically generated
```

---

## 🔍 Monitoring & Diagnostics

### Health Check Interpretation

```bash
curl https://tiqology.vercel.app/api/health | jq
```

**Healthy Response**:
```json
{
  "status": "healthy",
  "services": {
    "database": { "status": "healthy", "latency": "<100ms" },
    "api": { "status": "healthy" }
  },
  "performance": {
    "errorRate": "<5%",
    "avgResponseTime": "<200ms"
  }
}
```

**Unhealthy Indicators**:
- `status: "degraded"` or `"unhealthy"`
- Database latency > 500ms
- Error rate > 10%
- Response time > 1000ms

### Log Analysis

```bash
# Recent errors
vercel logs --limit 100 | grep ERROR

# Performance issues
vercel logs --limit 100 | grep "slow query"

# Authentication failures
vercel logs --limit 100 | grep "401\|403"

# Database issues
vercel logs --limit 100 | grep "database\|connection"
```

---

## 🗂️ Rollback Strategies

### 1. Automated Rollback (Preferred)

**Triggers automatically on**:
- Health check failures (3+ in 5 minutes)
- Error rate > 50% for 2+ minutes
- Pod crash loops (5+ times)
- Deployment timeout (>10 minutes)

**Configuration**: `gitops/policies/rollback-policy.yaml`

### 2. Manual Rollback via GitHub

```bash
# Option A: Workflow dispatch
gh workflow run automated-rollback.yml \
  -f environment=production \
  -f reason="Manual rollback request"

# Option B: Revert commit
git revert HEAD
git push origin main
# CI/CD automatically deploys

# Option C: Deploy previous version
vercel rollback
```

### 3. Emergency Rollback (Offline)

```bash
# Create rollback script
cat > scripts/emergency-rollback.sh << 'EOF'
#!/bin/bash
ENVIRONMENT=${1:-production}

# Get last stable deployment
STABLE_COMMIT=$(git log --pretty=format:"%H" --max-count=2 | tail -1)

# Revert to stable commit
git checkout $STABLE_COMMIT
vercel --prod --force

echo "Rolled back to $STABLE_COMMIT"
EOF

chmod +x scripts/emergency-rollback.sh

# Execute rollback
./scripts/emergency-rollback.sh production
```

---

## 🔐 Secret Management

### Accessing Secrets

```bash
# List all secrets
gh secret list

# View production environment variables
vercel env ls production

# Pull environment variables locally (NEVER commit)
vercel env pull .env.local
```

### Rotating Secrets (Zero Downtime)

```bash
# 1. Add new secret to Vercel
vercel env add API_KEY_NEW production

# 2. Update code to check both keys
# 3. Deploy new version
vercel --prod

# 4. Verify new key works
curl https://tiqology.vercel.app/api/health

# 5. Remove old secret
vercel env rm API_KEY_OLD production

# 6. Clean up code
# 7. Deploy again
```

---

## 📊 Performance Optimization

### Build Time Optimization

```bash
# Clear all caches
rm -rf .next node_modules
pnpm install
pnpm build

# Verify build time
time pnpm build

# Target: <2 minutes
```

### Database Query Optimization

```bash
# Analyze slow queries
psql $DATABASE_URL -c "
  SELECT query, mean_exec_time, calls 
  FROM pg_stat_statements 
  ORDER BY mean_exec_time DESC 
  LIMIT 10;
"

# Add indexes if needed
psql $DATABASE_URL -c "
  CREATE INDEX CONCURRENTLY idx_users_email ON tiq_users(email);
"
```

---

## 🧪 Testing Procedures

### Pre-Deployment Testing

```bash
# 1. Run all tests
pnpm test

# 2. Run type checking
pnpm type-check

# 3. Run linting
pnpm lint

# 4. Run security audit
pnpm audit

# 5. Build locally
pnpm build

# 6. Test locally
pnpm start
curl http://localhost:3000/api/health
```

### Post-Deployment Smoke Tests

```bash
# Health endpoint
curl https://tiqology.vercel.app/api/health

# Authentication flow
curl -X POST https://tiqology.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test"}'

# AI chat endpoint
curl -X POST https://tiqology.vercel.app/api/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"message":"Hello"}'
```

---

## 🔔 Incident Response

### Severity Levels

| Level | Response Time | Action |
|-------|---------------|--------|
| **P0 - Critical** | Immediate | Emergency rollback, all hands |
| **P1 - High** | 15 minutes | Investigate, prepare rollback |
| **P2 - Medium** | 1 hour | Monitor, schedule fix |
| **P3 - Low** | Next sprint | Create issue, backlog |

### Incident Checklist

```bash
# 1. Assess severity
□ Users affected: ____%
□ Core functionality broken: Yes/No
□ Data loss risk: Yes/No

# 2. Communicate
□ Post to #incidents Discord channel
□ Update status page
□ Notify stakeholders

# 3. Mitigate
□ Rollback if P0/P1
□ Apply hotfix if possible
□ Monitor recovery

# 4. Document
□ Root cause analysis
□ Timeline of events
□ Corrective actions
□ Prevention measures
```

---

## 📞 Emergency Contacts

| Role | Contact | Availability |
|------|---------|--------------|
| **DevOps Lead** | ops@tiqology.com | 24/7 |
| **Engineering Manager** | eng@tiqology.com | Business hours |
| **On-Call Engineer** | oncall@tiqology.com | 24/7 |

### Discord Channels

- `#incidents` - Emergency incidents
- `#deployments` - Deployment notifications
- `#monitoring` - System alerts

---

## 🛠️ Common Issues & Solutions

### Issue: "Database connection timeout"

```bash
# Solution 1: Check connection string
echo $DATABASE_URL

# Solution 2: Verify database is running
psql $DATABASE_URL -c "SELECT NOW()"

# Solution 3: Check connection pool
vercel env add DATABASE_CONNECTION_POOL_SIZE 10 production
```

### Issue: "Build failed on Vercel"

```bash
# Solution 1: Check build logs
vercel logs --limit 100

# Solution 2: Verify dependencies
pnpm install --frozen-lockfile

# Solution 3: Clear build cache
vercel --prod --force
```

### Issue: "High memory usage"

```bash
# Solution 1: Check memory limits
vercel inspect [deployment-url]

# Solution 2: Analyze bundle size
pnpm build
npx bundlesize

# Solution 3: Optimize imports
# Use dynamic imports for heavy modules
```

---

## 📚 Additional Resources

- **Full Documentation**: `/docs/CI-CD-SETUP.md`
- **Architecture Guide**: `/docs/TIQOLOGY_ARCHITECTURE_MAP.md`
- **GitOps Policies**: `/gitops/policies/`
- **Workflow Definitions**: `/.github/workflows/`

---

## ✅ Post-Incident Checklist

After any emergency rollback or incident:

```bash
□ Verify system health restored
□ Document incident details
□ Create postmortem doc
□ Update runbooks
□ Schedule retrospective
□ Implement preventive measures
□ Update monitoring/alerts
□ Test rollback procedure
```

---

**Remember**: When in doubt, rollback first, investigate later. User experience is priority #1.
