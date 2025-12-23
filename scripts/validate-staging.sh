#!/bin/bash

# TiQology AIF v2.0 - Stage 3 Staging Validation Script
# Commander Authorization: STAGE 3 EXECUTE
# Purpose: Validate Phase III components before production promotion

set -e

echo "🚀 TiQology AIF v2.0 - Stage 3 Validation"
echo "=========================================="
echo ""

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Validation results
VALIDATION_PASSED=true
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0

# Function to run a check
run_check() {
    local check_name="$1"
    local check_command="$2"
    
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    echo -e "${BLUE}▶${NC} Running: $check_name"
    
    if eval "$check_command"; then
        echo -e "${GREEN}✓${NC} PASSED: $check_name"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
        return 0
    else
        echo -e "${RED}✗${NC} FAILED: $check_name"
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
        VALIDATION_PASSED=false
        return 1
    fi
}

echo "Step 1: Environment Configuration"
echo "-----------------------------------"

# Check .env.local exists
run_check "Environment file exists" "[ -f .env.local ]"

# Check critical environment variables
run_check "DATABASE_URL configured" "grep -q 'DATABASE_URL=' .env.local"
run_check "SUPABASE_URL configured" "grep -q 'NEXT_PUBLIC_SUPABASE_URL=' .env.local"
run_check "Redis URL configured" "grep -q 'REDIS_URL=' .env.local"

echo ""
echo "Step 2: Phase III Module Validation"
echo "-------------------------------------"

# Check Phase III files exist
run_check "Governance Core exists" "[ -f lib/governance-core.ts ]"
run_check "Context Synchronizer exists" "[ -f lib/context-sync.ts ]"
run_check "Privacy Mesh (Audit) exists" "[ -f lib/privacy-mesh.ts ]"
run_check "Agent Swarm (Lifecycle) exists" "[ -f lib/agent-swarm.ts ]"
run_check "Command Center exists" "[ -f public/command-center.html ]"
run_check "Database migrations exist" "[ -f db/migrations/phase_iii_tables.sql ]"

echo ""
echo "Step 3: TypeScript Compilation Check"
echo "--------------------------------------"

run_check "TypeScript compiles without errors" "pnpm run build > /dev/null 2>&1"

echo ""
echo "Step 4: Database Connection Test"
echo "----------------------------------"

# Test database connection (will create a simple query test)
if command -v psql &> /dev/null; then
    if [ -n "$DATABASE_URL" ]; then
        run_check "Database connection" "psql \"$DATABASE_URL\" -c 'SELECT 1;' > /dev/null 2>&1"
    else
        echo -e "${YELLOW}⚠${NC} SKIPPED: DATABASE_URL not set in environment"
    fi
else
    echo -e "${YELLOW}⚠${NC} SKIPPED: psql not installed"
fi

echo ""
echo "Step 5: Redis Connection Test"
echo "-------------------------------"

# Test Redis connection (basic ping)
if command -v redis-cli &> /dev/null; then
    if [ -n "$REDIS_URL" ]; then
        run_check "Redis connection" "redis-cli -u \"$REDIS_URL\" ping > /dev/null 2>&1"
    else
        echo -e "${YELLOW}⚠${NC} SKIPPED: REDIS_URL not set in environment"
    fi
else
    echo -e "${YELLOW}⚠${NC} SKIPPED: redis-cli not installed"
fi

echo ""
echo "Step 6: Build Artifacts Validation"
echo "------------------------------------"

run_check "Next.js build directory exists" "[ -d .next ]"
run_check "Production build complete" "[ -f .next/BUILD_ID ]"

echo ""
echo "Step 7: Security & Compliance Check"
echo "-------------------------------------"

# Check for hardcoded secrets (basic scan)
run_check "No hardcoded API keys in source" "! grep -r 'sk-[a-zA-Z0-9]\{20,\}' lib/ components/ app/ 2>/dev/null"
run_check "No hardcoded passwords" "! grep -ri 'password.*=.*[\"'][^\"']*[\"']' lib/ components/ app/ 2>/dev/null | grep -v '.test.' | grep -v 'placeholder'"

echo ""
echo "=========================================="
echo "🎯 VALIDATION SUMMARY"
echo "=========================================="
echo ""
echo "Total Checks: $TOTAL_CHECKS"
echo -e "${GREEN}Passed: $PASSED_CHECKS${NC}"
echo -e "${RED}Failed: $FAILED_CHECKS${NC}"
echo ""

if [ "$VALIDATION_PASSED" = true ]; then
    echo -e "${GREEN}✓ VALIDATION PASSED${NC}"
    echo ""
    echo "🚀 System is ready for staging deployment"
    echo ""
    echo "Next Steps:"
    echo "1. Run: pnpm dev"
    echo "2. Test Command Center: http://localhost:3000/command-center.html"
    echo "3. Verify all 6 modules report 'Active'"
    echo "4. Monitor 24-hour telemetry"
    echo "5. Tag v2.0.1 and promote to production"
    echo ""
    exit 0
else
    echo -e "${RED}✗ VALIDATION FAILED${NC}"
    echo ""
    echo "⚠️ Please fix the failed checks before proceeding"
    echo ""
    echo "For assistance:"
    echo "- Review error messages above"
    echo "- Check .env.local configuration"
    echo "- Verify database migrations completed"
    echo "- Contact Commander or Devin for support"
    echo ""
    exit 1
fi
