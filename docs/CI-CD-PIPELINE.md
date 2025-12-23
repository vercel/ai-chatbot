# 🚀 TiQology CI/CD Pipeline Documentation

## Overview

This document describes the custom CI/CD pipeline for the TiQology AI Chatbot project. The pipeline is designed to ensure code quality, security, and reliable deployments across multiple environments.

## Pipeline Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     CI/CD Pipeline Flow                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Code Push/PR                                                    │
│       ↓                                                          │
│  ┌──────────┐                                                    │
│  │  Setup   │ → Cache Dependencies & Environment                │
│  └────┬─────┘                                                    │
│       ↓                                                          │
│  ┌──────────────────────────────────────┐                       │
│  │  Parallel Quality & Security Checks   │                      │
│  ├──────────┬──────────┬────────────────┤                       │
│  │  Lint    │  Type    │   Security     │                       │
│  │  Check   │  Check   │   Scan         │                       │
│  └────┬─────┴────┬─────┴────┬───────────┘                       │
│       └──────────┴──────────┘                                   │
│              ↓                                                   │
│  ┌──────────────────────────┐                                   │
│  │  Parallel Test Execution  │                                  │
│  ├──────────┬───────────────┤                                   │
│  │  Unit    │    E2E        │                                   │
│  │  Tests   │    Tests      │                                   │
│  └────┬─────┴────┬──────────┘                                   │
│       └──────────┘                                              │
│              ↓                                                   │
│  ┌─────────────┐                                                │
│  │    Build    │ → Create Production Build                      │
│  └──────┬──────┘                                                │
│         ↓                                                        │
│  ┌──────────────────────────────────────┐                       │
│  │      Environment Deployments          │                      │
│  ├──────────┬──────────┬────────────────┤                       │
│  │   Dev    │ Staging  │  Production    │                       │
│  │ (develop)│  (main)  │   (main)       │                       │
│  └──────────┴──────────┴────────────────┘                       │
│                              ↓                                   │
│  ┌──────────────────────────────────────┐                       │
│  │     Post-Deployment Tasks             │                      │
│  ├──────────┬──────────┬────────────────┤                       │
│  │   DB     │Lighthouse│    Health      │                       │
│  │Migration │  Audit   │    Checks      │                       │
│  └──────────┴──────────┴────────────────┘                       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Pipeline Components

### 1. Main CI/CD Pipeline (`ci-cd-pipeline.yml`)

The main pipeline includes the following stages:

#### Setup Stage
- **Purpose**: Environment preparation and dependency caching
- **Actions**:
  - Checkout code with full history
  - Generate cache keys for dependencies
  - Install and cache Node.js and pnpm
  - Install project dependencies
- **Caching Strategy**: Uses hash of `pnpm-lock.yaml` for cache invalidation

#### Quality Check Stage
- **Purpose**: Ensure code quality and standards
- **Checks**:
  - ESLint/Biome linting
  - TypeScript type checking
  - Code formatting validation
- **Parallel Execution**: Runs independently for faster feedback

#### Testing Stage
- **Unit Tests**:
  - Runs Jest test suite
  - Uses PostgreSQL test database
  - Generates coverage reports
  - Uploads test artifacts
  
- **E2E Tests**:
  - Playwright browser tests
  - Tests critical user flows
  - Generates visual regression reports
  - Can be skipped with workflow dispatch input

#### Build Stage
- **Purpose**: Create production-ready build
- **Actions**:
  - Build Next.js application
  - Analyze bundle size
  - Upload build artifacts for deployment
- **Memory**: Allocates 6GB for large builds

#### Security Scanning Stage
- **Vulnerability Scanning**:
  - Trivy filesystem scanner
  - SARIF report upload to GitHub Security
  - Dependency audit with pnpm
  - Outdated package detection

#### Docker Build Stage (Optional)
- **Purpose**: Create containerized version
- **Actions**:
  - Build Docker image
  - Tag with commit SHA
  - Use GitHub Actions cache for layers
- **When**: Only on `main` or `develop` branches

### 2. Environment Deployments

#### Development Environment
- **Trigger**: Push to `develop` branch
- **URL**: https://dev.tiqology.vercel.app
- **Features**:
  - Automatic deployment
  - PR comment with preview URL
  - Quick iteration testing

#### Staging Environment
- **Trigger**: Push to `main` branch
- **URL**: https://staging.tiqology.vercel.app
- **Features**:
  - Pre-production testing
  - E2E test execution
  - Performance validation

#### Production Environment
- **Trigger**: After successful staging deployment
- **URL**: https://tiqology.vercel.app
- **Features**:
  - Manual approval (environment protection)
  - Automated tagging
  - GitHub release creation
  - Cloudflare DNS configuration
  - Health checks
  - Rollback capability

### 3. Database Migrations

- **When**: After production deployment
- **Actions**:
  - Run Drizzle migrations
  - Verify schema integrity
  - Generate migration summary

### 4. Post-Deployment Tasks

#### Lighthouse Performance Audit
- **URLs Tested**:
  - Homepage
  - Login page
  - Register page
- **Metrics**: Performance, Accessibility, Best Practices, SEO

#### Health Checks
- **Endpoints**: `/api/health`
- **Validation**: HTTP 200 status
- **Alerts**: Failure notifications

### 5. Supporting Workflows

#### Preview Deployments (`preview-deployment.yml`)
- **Trigger**: Pull requests
- **Purpose**: Deploy PR changes to preview URL
- **Features**:
  - Automatic comment with preview link
  - Lighthouse audit on preview
  - Quick links to key pages

#### Dependency Updates (`dependency-updates.yml`)
- **Schedule**: Weekly (Monday 9 AM UTC)
- **Actions**:
  - Check for outdated packages
  - Update to latest versions
  - Run tests
  - Create automated PR

#### Security Analysis (`security-analysis.yml`)
- **Schedule**: Daily (2 AM UTC)
- **Components**:
  - CodeQL analysis
  - Dependency review
  - Secret scanning (TruffleHog)
  - Code coverage tracking
  - License compliance

## Required Secrets

Configure these secrets in your GitHub repository settings:

### Vercel Deployment
```
VERCEL_TOKEN          # Vercel authentication token
VERCEL_ORG_ID         # Vercel organization ID
VERCEL_PROJECT_ID     # Vercel project ID
```

### Database
```
PRODUCTION_DATABASE_URL  # PostgreSQL connection string for production
```

### Cloudflare (Optional)
```
CLOUDFLARE_ZONE_ID       # Cloudflare zone identifier
CLOUDFLARE_API_TOKEN     # Cloudflare API token
```

### Docker Hub (Optional)
```
DOCKER_USERNAME          # Docker Hub username
DOCKER_PASSWORD          # Docker Hub password or token
```

## Manual Workflow Triggers

### Workflow Dispatch Options

The main pipeline can be manually triggered with:

```yaml
Environment: development | staging | production
Skip Tests: true | false (default: false)
```

**Usage**:
1. Go to Actions tab in GitHub
2. Select "TiQology Custom CI/CD Pipeline"
3. Click "Run workflow"
4. Choose branch and options
5. Click "Run workflow" button

## Environment Protection Rules

### Production Environment
- **Reviewers**: Require approval from designated team members
- **Wait Timer**: Optional delay before deployment
- **Branch Protection**: Only `main` branch can deploy

### Staging Environment
- **Auto-deployment**: Enabled for `main` branch
- **Testing**: E2E tests run automatically

## Deployment Artifacts

All deployments create the following artifacts:

1. **Build Output** (7 days retention)
   - `.next` directory
   - `public` assets

2. **Test Results** (30 days retention)
   - Jest coverage reports
   - Playwright test results
   - E2E screenshots and videos

3. **Performance Reports**
   - Lighthouse scores
   - Bundle size analysis

## Rollback Procedure

### Automatic Rollback
- Triggered on production deployment failure
- Reverts to last known good deployment
- Notifications sent to team

### Manual Rollback
1. Navigate to Vercel dashboard
2. Select previous deployment
3. Click "Promote to Production"
4. Verify health checks

Or use Git:
```bash
git revert <commit-hash>
git push origin main
```

## Monitoring and Alerts

### Success Notifications
- GitHub commit status
- Deployment summaries
- Performance reports

### Failure Notifications
- Failed build alerts
- Test failure reports
- Security vulnerability warnings
- Health check failures

## Performance Optimizations

1. **Parallel Job Execution**: Quality checks, tests, and scans run simultaneously
2. **Smart Caching**: Dependencies cached based on lockfile hash
3. **Artifact Reuse**: Build artifacts shared across deployment jobs
4. **Conditional Execution**: Skip unnecessary jobs based on branch/triggers
5. **Incremental Builds**: Only rebuild changed components

## Best Practices

### For Developers

1. **Before Pushing**:
   ```bash
   pnpm lint        # Check code style
   pnpm test        # Run tests locally
   pnpm build       # Ensure build succeeds
   ```

2. **Feature Branches**:
   - Create from `develop`
   - Name format: `feature/description`
   - Open PR to `develop` for review

3. **Hotfix Branches**:
   - Create from `main`
   - Name format: `fix/description`
   - Open PR to `main` with urgency label

### For Reviewers

1. Check preview deployment before approving
2. Review test results and coverage
3. Verify no security vulnerabilities
4. Ensure performance metrics are acceptable

## Troubleshooting

### Build Failures

**Issue**: Out of memory error
```
Solution: Increase NODE_OPTIONS memory allocation
Already set to --max-old-space-size=6144
```

**Issue**: Dependency installation fails
```
Solution: Clear cache and retry
- Delete cache in GitHub Actions settings
- Re-run workflow
```

### Test Failures

**Issue**: E2E tests timing out
```
Solution: Increase Playwright timeout
Edit playwright.config.ts timeout settings
```

**Issue**: Database connection errors
```
Solution: Verify POSTGRES_URL secret
Check database is accessible from GitHub runners
```

### Deployment Failures

**Issue**: Vercel deployment fails
```
Solution: Check Vercel token and project settings
Verify VERCEL_TOKEN, VERCEL_ORG_ID, VERCEL_PROJECT_ID
```

**Issue**: Health check fails
```
Solution: Wait longer for deployment to warm up
Check application logs in Vercel dashboard
```

## Metrics and KPIs

Track these metrics for pipeline health:

- **Build Time**: Target < 10 minutes
- **Test Success Rate**: Target > 95%
- **Deployment Frequency**: Target 2-3x per day
- **Mean Time to Recovery**: Target < 1 hour
- **Lighthouse Performance Score**: Target > 90

## Future Enhancements

Planned improvements:

1. ✅ Automated dependency updates
2. ✅ Advanced security scanning
3. ✅ Performance monitoring
4. 🔄 Slack/Discord notifications
5. 🔄 Automated rollback on errors
6. 🔄 Blue-green deployments
7. 🔄 Canary releases
8. 🔄 A/B testing infrastructure

## Contact and Support

For pipeline issues or questions:
- Create an issue in the repository
- Tag with `ci-cd` label
- Include workflow run URL
- Provide error logs

---

**Last Updated**: December 22, 2025
**Version**: 2.0
**Maintained By**: TiQology DevOps Team
