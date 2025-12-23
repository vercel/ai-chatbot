# 🚀 CI/CD Pipeline Quick Reference

## Quick Commands

### Local Testing Before Push
```bash
# Run all checks locally
pnpm lint                    # Lint check
pnpm exec tsc --noEmit       # Type check
pnpm test                    # Run tests
pnpm build                   # Build application

# Or run all at once
pnpm lint && pnpm exec tsc --noEmit && pnpm test && pnpm build
```

### Manual Deployment Trigger
```bash
# Using GitHub CLI
gh workflow run "TiQology Custom CI/CD Pipeline" \
  --ref main \
  -f environment=production \
  -f skip_tests=false
```

### Check Pipeline Status
```bash
# List recent workflow runs
gh run list --workflow=ci-cd-pipeline.yml

# View specific run
gh run view <run-id>

# Watch live
gh run watch
```

## Pipeline Triggers

| Event | Branch | Deploys To |
|-------|--------|------------|
| Push | `develop` | Development |
| Push | `main` | Staging → Production |
| PR | Any | Preview Environment |
| Manual | Any | User-selected environment |
| Schedule | `main` | Security scans only |

## Environment URLs

| Environment | URL | Protected |
|-------------|-----|-----------|
| Development | https://dev.tiqology.vercel.app | ❌ |
| Staging | https://staging.tiqology.vercel.app | ❌ |
| Production | https://tiqology.vercel.app | ✅ |

## Workflow Files

| File | Purpose | Trigger |
|------|---------|---------|
| `ci-cd-pipeline.yml` | Main deployment pipeline | Push, PR, Manual |
| `preview-deployment.yml` | PR preview deployments | Pull Request |
| `security-analysis.yml` | Security & code quality | Push, Schedule |
| `dependency-updates.yml` | Automated dependency updates | Weekly schedule |

## Pipeline Stages

```
Setup (1-2 min)
  ↓
Quality Checks (2-3 min) ⎫
Tests (3-5 min)          ⎬ Parallel
Security Scan (2-3 min)  ⎭
  ↓
Build (3-5 min)
  ↓
Deploy Dev/Staging (2-3 min)
  ↓
Deploy Production (2-3 min) [Manual approval]
  ↓
Post-Deploy (2-3 min)
```

**Total Time**: ~15-20 minutes (main → production)

## Required Secrets

### Essential (Required for deployment)
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`
- `PRODUCTION_DATABASE_URL`

### Optional (Enhanced features)
- `CLOUDFLARE_ZONE_ID`
- `CLOUDFLARE_API_TOKEN`
- `DOCKER_USERNAME`
- `DOCKER_PASSWORD`

## Common Scenarios

### 1. Deploy Feature to Development
```bash
git checkout develop
git pull origin develop
git checkout -b feature/my-feature
# Make changes
git add .
git commit -m "feat: add new feature"
git push origin feature/my-feature
# Open PR to develop
```

### 2. Hotfix to Production
```bash
git checkout main
git pull origin main
git checkout -b fix/critical-bug
# Make fixes
git add .
git commit -m "fix: resolve critical bug"
git push origin fix/critical-bug
# Open PR to main with "hotfix" label
```

### 3. Manual Production Deploy
1. Go to: https://github.com/vercel/ai-chatbot/actions
2. Select "TiQology Custom CI/CD Pipeline"
3. Click "Run workflow"
4. Choose:
   - Branch: `main`
   - Environment: `production`
   - Skip tests: `false`
5. Click "Run workflow"
6. Approve when prompted

### 4. Rollback Production
**Option A: Vercel Dashboard**
1. Go to Vercel project
2. Select "Deployments"
3. Find last stable deployment
4. Click "..." → "Promote to Production"

**Option B: Git Revert**
```bash
git checkout main
git revert <bad-commit-hash>
git push origin main
# CI/CD will auto-deploy
```

## Monitoring

### View Deployment Status
```bash
# GitHub CLI
gh run list --workflow=ci-cd-pipeline.yml --limit 5

# Check specific deployment
gh run view <run-id> --log
```

### Check Application Health
```bash
# Production
curl https://tiqology.vercel.app/api/health

# Staging
curl https://staging.tiqology.vercel.app/api/health

# Expected response
{
  "status": "healthy",
  "timestamp": "2025-12-22T...",
  "services": {
    "database": { "status": "healthy", "latency": "45ms" },
    "api": { "status": "healthy", "latency": "12ms" }
  }
}
```

### View Logs
```bash
# Vercel CLI
vercel logs <deployment-url>

# Or in Vercel Dashboard
# https://vercel.com/your-org/project/deployments
```

## Troubleshooting

### Build Failed: Out of Memory
**Solution**: Already configured with 6GB. If still failing:
```yaml
# In workflow file, increase:
NODE_OPTIONS: '--max-old-space-size=8192'
```

### Tests Failed: Database Connection
**Check**: 
```bash
# Verify secret is set
gh secret list

# Test connection locally
POSTGRES_URL="your-url" pnpm db:migrate
```

### Deployment Failed: Vercel Token
**Fix**:
```bash
# Get new token from Vercel
# https://vercel.com/account/tokens

# Update secret
gh secret set VERCEL_TOKEN
```

### E2E Tests Timeout
**Quick Fix**:
```bash
# Skip tests for urgent deploy
gh workflow run ci-cd-pipeline.yml -f skip_tests=true
```

## Performance Benchmarks

| Metric | Target | Current |
|--------|--------|---------|
| Total Pipeline Time | < 20 min | ~18 min |
| Build Time | < 5 min | ~4 min |
| Test Execution | < 5 min | ~4 min |
| Deployment | < 3 min | ~2 min |
| Lighthouse Score | > 90 | ~92 |

## Best Practices

### ✅ Do
- Run tests locally before pushing
- Write descriptive commit messages
- Keep PRs focused and small
- Wait for CI checks before merging
- Review preview deployments
- Tag production releases

### ❌ Don't
- Skip tests (unless emergency)
- Merge failing CI checks
- Deploy directly to production
- Ignore security warnings
- Push directly to `main`
- Commit secrets or `.env` files

## Emergency Contacts

### Pipeline Issues
- Check Actions tab for error logs
- Review workflow YAML syntax
- Verify all secrets are set
- Check service status (GitHub, Vercel)

### Deployment Issues
- Verify Vercel project settings
- Check environment variables
- Review application logs
- Test health endpoint

---

**Quick Links**:
- [📚 Full Documentation](./CI-CD-PIPELINE.md)
- [🔧 GitHub Actions](https://github.com/vercel/ai-chatbot/actions)
- [📊 Vercel Dashboard](https://vercel.com)
- [🐛 Report Issues](https://github.com/vercel/ai-chatbot/issues)

**Last Updated**: December 22, 2025
