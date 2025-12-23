#!/bin/bash

###############################################################################
# TiQology Emergency Rollback Script
# 
# Performs immediate rollback to last stable deployment
###############################################################################

set -e

ENVIRONMENT=${1:-production}
REASON=${2:-"Emergency rollback"}

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  TiQology Emergency Rollback"
echo "  Environment: $ENVIRONMENT"
echo "  Reason: $REASON"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Step 1: Get last stable commit
log_warning "Finding last stable deployment..."
CURRENT_COMMIT=$(git rev-parse HEAD)
STABLE_COMMIT=$(git log --pretty=format:"%H" --max-count=2 | tail -1)

echo "Current commit: $CURRENT_COMMIT"
echo "Rolling back to: $STABLE_COMMIT"
echo ""

# Step 2: Confirm rollback
read -p "Proceed with rollback? (yes/no): " confirm
if [[ $confirm != "yes" ]]; then
    log_error "Rollback cancelled"
    exit 1
fi

# Step 3: Checkout stable commit
log_warning "Checking out stable commit..."
git checkout $STABLE_COMMIT

# Step 4: Deploy
log_warning "Deploying rollback to $ENVIRONMENT..."
if [[ $ENVIRONMENT == "production" ]]; then
    vercel --prod --force
else
    vercel --force
fi

# Step 5: Verify health
log_warning "Verifying deployment health..."
sleep 10

HEALTH_URL="https://tiqology.vercel.app/api/health"
if [[ $ENVIRONMENT != "production" ]]; then
    HEALTH_URL="https://${ENVIRONMENT}.tiqology.vercel.app/api/health"
fi

HEALTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" $HEALTH_URL || echo "000")

if [[ $HEALTH_STATUS == "200" ]]; then
    log_success "Rollback successful! Health check passed."
    echo ""
    echo "✅ System restored to commit: $STABLE_COMMIT"
    echo "🔗 Health endpoint: $HEALTH_URL"
else
    log_error "Rollback deployed but health check failed (HTTP $HEALTH_STATUS)"
    echo "⚠️  Manual intervention may be required"
    exit 1
fi

# Step 6: Create incident report
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
REPORT_FILE="incident-reports/rollback-${TIMESTAMP}.md"

mkdir -p incident-reports
cat > $REPORT_FILE << EOF
# Rollback Incident Report

**Date**: $(date)
**Environment**: $ENVIRONMENT
**Reason**: $REASON

## Details

- **Current Commit**: $CURRENT_COMMIT
- **Rolled Back To**: $STABLE_COMMIT
- **Health Check**: $HEALTH_STATUS
- **Executed By**: $(git config user.name)

## Next Steps

- [ ] Investigate root cause of failure
- [ ] Create bug ticket
- [ ] Update monitoring/alerts
- [ ] Schedule postmortem

EOF

log_success "Incident report created: $REPORT_FILE"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
