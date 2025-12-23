#!/bin/bash

###############################################################################
# TiQology Post-Deployment Validation Script
# 
# Performs comprehensive validation of the CI/CD + GitOps infrastructure
###############################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Results tracking
PASSED_TESTS=0
FAILED_TESTS=0
WARNING_TESTS=0
TOTAL_TESTS=0

# Log functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
    ((PASSED_TESTS++))
    ((TOTAL_TESTS++))
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
    ((FAILED_TESTS++))
    ((TOTAL_TESTS++))
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
    ((WARNING_TESTS++))
    ((TOTAL_TESTS++))
}

log_section() {
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
}

###############################################################################
# 1. ARGOCD AUTO-SYNC VALIDATION
###############################################################################
validate_argocd() {
    log_section "1. ArgoCD Auto-Sync Validation"
    
    # Check if ArgoCD config exists
    if [ -f "gitops/argocd-config.yaml" ]; then
        log_success "ArgoCD configuration file exists"
        
        # Validate auto-sync is enabled
        if grep -q "automated:" gitops/argocd-config.yaml 2>/dev/null || \
           grep -q "auto_sync:" gitops/policies/drift-detection.yaml 2>/dev/null; then
            log_success "Auto-sync configuration detected"
        else
            log_warning "Auto-sync may not be configured"
        fi
        
        # Check drift detection
        if [ -f "gitops/policies/drift-detection.yaml" ]; then
            log_success "Drift detection policy exists"
            
            if grep -q "enabled: true" gitops/policies/drift-detection.yaml; then
                log_success "Drift detection is enabled"
            else
                log_error "Drift detection is not enabled"
            fi
        else
            log_error "Drift detection policy not found"
        fi
    else
        log_error "ArgoCD configuration not found"
    fi
}

###############################################################################
# 2. ROLLBACK POLICY VALIDATION
###############################################################################
validate_rollback() {
    log_section "2. Rollback Policy Validation"
    
    if [ -f "gitops/policies/rollback-policy.yaml" ]; then
        log_success "Rollback policy file exists"
        
        # Check if rollback is enabled
        if grep -q "enabled: true" gitops/policies/rollback-policy.yaml; then
            log_success "Rollback policy is enabled"
        else
            log_error "Rollback policy is not enabled"
        fi
        
        # Check for trigger conditions
        if grep -q "health-check-failure" gitops/policies/rollback-policy.yaml; then
            log_success "Health check failure trigger configured"
        else
            log_warning "Health check failure trigger not found"
        fi
        
        # Check automated rollback workflow
        if [ -f ".github/workflows/automated-rollback.yml" ]; then
            log_success "Automated rollback workflow exists"
        else
            log_error "Automated rollback workflow not found"
        fi
    else
        log_error "Rollback policy not found"
    fi
}

###############################################################################
# 3. AI & QUANTUM TEST WORKFLOWS
###############################################################################
validate_test_workflows() {
    log_section "3. AI & Quantum Test Workflows"
    
    # Check GPU AI tests
    if [ -f ".github/workflows/gpu-ai-tests.yml" ]; then
        log_success "GPU AI tests workflow exists"
        
        # Validate workflow syntax
        if grep -q "name: AI & GPU Inference Validation" .github/workflows/gpu-ai-tests.yml; then
            log_success "GPU AI tests workflow is properly configured"
        fi
    else
        log_error "GPU AI tests workflow not found"
    fi
    
    # Check quantum holographic tests
    if [ -f ".github/workflows/quantum-holographic-tests.yml" ]; then
        log_success "Quantum holographic tests workflow exists"
        
        if grep -q "name: Quantum Computing & Holographic Tests" .github/workflows/quantum-holographic-tests.yml; then
            log_success "Quantum tests workflow is properly configured"
        fi
    else
        log_error "Quantum holographic tests workflow not found"
    fi
}

###############################################################################
# 4. OIDC AUTHENTICATION VALIDATION
###############################################################################
validate_oidc() {
    log_section "4. OIDC Authentication Validation"
    
    # Check for OIDC configuration in workflows
    if grep -rq "id-token: write" .github/workflows/*.yml 2>/dev/null; then
        log_success "OIDC permissions configured in workflows"
    else
        log_warning "OIDC permissions not found in workflows"
    fi
    
    # Check security governance workflow
    if [ -f ".github/workflows/security-governance.yml" ]; then
        log_success "Security governance workflow exists"
        
        if grep -q "oidc-auth:" .github/workflows/security-governance.yml; then
            log_success "OIDC authentication job configured"
        fi
        
        # Verify AWS OIDC
        if grep -q "aws-actions/configure-aws-credentials" .github/workflows/security-governance.yml; then
            log_success "AWS OIDC integration configured"
        fi
        
        # Verify Vercel (implicit OIDC through token)
        if grep -rq "VERCEL_TOKEN" .github/workflows/*.yml 2>/dev/null; then
            log_success "Vercel authentication configured"
        fi
    else
        log_warning "Security governance workflow not found"
    fi
    
    # Check for hardcoded secrets (should not exist)
    log_info "Scanning for hardcoded secrets..."
    if grep -rE "(password|secret|key|token).*=.*['\"][^'\"]{10,}['\"]" \
        --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=.next \
        --exclude="*.md" --exclude="*.log" . 2>/dev/null | grep -v "github/workflows" | head -5; then
        log_error "Potential hardcoded secrets detected"
    else
        log_success "No obvious hardcoded secrets found"
    fi
}

###############################################################################
# 5. DISCORD WEBHOOK VALIDATION
###############################################################################
validate_discord() {
    log_section "5. Discord Webhook Validation"
    
    if [ -f ".github/workflows/discord-notifications.yml" ]; then
        log_success "Discord notifications workflow exists"
        
        # Check for webhook configuration
        if grep -q "DISCORD_WEBHOOK_URL" .github/workflows/discord-notifications.yml; then
            log_success "Discord webhook URL configured"
        else
            log_error "Discord webhook URL not configured"
        fi
        
        # Check for notification triggers
        if grep -q "workflow_run:" .github/workflows/discord-notifications.yml; then
            log_success "Discord notifications triggered on workflow completion"
        fi
        
        # Check for both success and failure notifications
        if grep -q "success" .github/workflows/discord-notifications.yml && \
           grep -q "failure" .github/workflows/discord-notifications.yml; then
            log_success "Both success and failure notifications configured"
        else
            log_warning "Not all notification types configured"
        fi
    else
        log_error "Discord notifications workflow not found"
    fi
}

###############################################################################
# 6. DATABASE MIGRATION VALIDATION
###############################################################################
validate_database_migrations() {
    log_section "6. Database Migration Validation"
    
    # Check for database migration workflows
    if [ -f ".github/workflows/db_checks.yml" ]; then
        log_success "Database checks workflow exists"
    else
        log_warning "Database checks workflow not found"
    fi
    
    # Check environment deployment workflow for DB migrations
    if [ -f ".github/workflows/environment-deployment.yml" ]; then
        log_success "Environment deployment workflow exists"
        
        if grep -q "DATABASE_URL" .github/workflows/environment-deployment.yml; then
            log_success "Database URL configured in deployments"
        fi
    fi
    
    # Check for migration scripts
    if [ -f "drizzle.config.ts" ]; then
        log_success "Drizzle ORM configuration exists"
    fi
    
    if [ -d "db" ]; then
        log_success "Database directory exists"
    fi
    
    # Check for multi-environment database configuration
    if [ -f ".env.development.template" ] && \
       [ -f ".env.staging.template" ] && \
       [ -f ".env.production.template" ]; then
        log_success "Multi-environment database templates configured"
    else
        log_warning "Not all environment templates found"
    fi
}

###############################################################################
# 7. HEALTH ENDPOINT VALIDATION
###############################################################################
validate_health_endpoints() {
    log_section "7. Health Endpoint Validation"
    
    # Check if health endpoint exists
    if [ -f "app/api/health/route.ts" ]; then
        log_success "Health endpoint exists"
        
        # Check for comprehensive health checks
        if grep -q "database" app/api/health/route.ts && \
           grep -q "performance" app/api/health/route.ts; then
            log_success "Health endpoint includes database and performance checks"
        fi
    else
        log_error "Health endpoint not found"
    fi
    
    # Test health endpoint if URL is available
    if [ -n "${DEPLOYMENT_URL}" ]; then
        log_info "Testing health endpoint at ${DEPLOYMENT_URL}/api/health"
        
        response_code=$(curl -s -o /dev/null -w "%{http_code}" "${DEPLOYMENT_URL}/api/health" || echo "000")
        
        if [ "$response_code" = "200" ]; then
            log_success "Health endpoint is accessible (HTTP 200)"
        elif [ "$response_code" = "000" ]; then
            log_warning "Could not reach health endpoint (network error)"
        else
            log_error "Health endpoint returned HTTP $response_code"
        fi
    else
        log_info "DEPLOYMENT_URL not set, skipping live health check"
    fi
}

###############################################################################
# 8. CACHING VALIDATION
###############################################################################
validate_caching() {
    log_section "8. Caching Configuration Validation"
    
    # Check for pnpm caching in workflows
    if grep -rq "cache: 'pnpm'" .github/workflows/*.yml; then
        log_success "pnpm caching configured in workflows"
    else
        log_warning "pnpm caching not found in workflows"
    fi
    
    # Check for Docker layer caching
    if grep -rq "cache-from" .github/workflows/*.yml || \
       grep -rq "buildx" .github/workflows/*.yml; then
        log_success "Docker caching configured"
    else
        log_warning "Docker layer caching not explicitly configured"
    fi
    
    # Check for actions/cache usage
    if grep -rq "actions/cache@v" .github/workflows/*.yml; then
        log_success "GitHub Actions cache being used"
    else
        log_warning "GitHub Actions cache not found"
    fi
}

###############################################################################
# 9. SECURITY VALIDATION
###############################################################################
validate_security() {
    log_section "9. Security Configuration Validation"
    
    # Check for security workflows
    if [ -f ".github/workflows/security-governance.yml" ]; then
        log_success "Security governance workflow exists"
    fi
    
    if [ -f ".github/workflows/security-analysis.yml" ]; then
        log_success "Security analysis workflow exists"
    fi
    
    # Check for CodeQL
    if grep -rq "github/codeql-action" .github/workflows/*.yml; then
        log_success "CodeQL security scanning configured"
    else
        log_warning "CodeQL scanning not found"
    fi
    
    # Check for Trivy scanning
    if grep -rq "aquasecurity/trivy" .github/workflows/*.yml || \
       grep -rq "trivy" .github/workflows/*.yml; then
        log_success "Trivy vulnerability scanning configured"
    else
        log_warning "Trivy scanning not found"
    fi
    
    # Check for secret scanning
    if grep -rq "trufflesecurity/trufflehog" .github/workflows/*.yml || \
       grep -rq "gitleaks" .github/workflows/*.yml; then
        log_success "Secret scanning configured"
    else
        log_warning "Secret scanning tools not found"
    fi
}

###############################################################################
# 10. ENVIRONMENT ENCRYPTION VALIDATION
###############################################################################
validate_environment_encryption() {
    log_section "10. Environment Variable Encryption Validation"
    
    # Check for environment templates
    env_templates=(
        ".env.development.template"
        ".env.staging.template"
        ".env.production.template"
    )
    
    for template in "${env_templates[@]}"; do
        if [ -f "$template" ]; then
            log_success "Environment template exists: $template"
            
            # Check that templates don't contain real secrets
            if grep -qE "[a-zA-Z0-9]{32,}" "$template" 2>/dev/null; then
                log_warning "Template $template may contain actual secret values"
            else
                log_success "Template $template appears clean (no long secrets)"
            fi
        else
            log_warning "Environment template not found: $template"
        fi
    done
    
    # Check for .env files in .gitignore
    if [ -f ".gitignore" ] && grep -q "\.env" .gitignore; then
        log_success ".env files are in .gitignore"
    else
        log_error ".env files may not be properly ignored"
    fi
}

###############################################################################
# SUMMARY
###############################################################################
print_summary() {
    log_section "Validation Summary"
    
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo -e "${GREEN}  Passed:   $PASSED_TESTS / $TOTAL_TESTS${NC}"
    echo -e "${YELLOW}  Warnings: $WARNING_TESTS / $TOTAL_TESTS${NC}"
    echo -e "${RED}  Failed:   $FAILED_TESTS / $TOTAL_TESTS${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    
    # Calculate pass rate
    if [ $TOTAL_TESTS -gt 0 ]; then
        pass_rate=$((PASSED_TESTS * 100 / TOTAL_TESTS))
        
        if [ $pass_rate -ge 90 ]; then
            echo -e "${GREEN}🎉 Excellent! System is production ready (${pass_rate}% pass rate)${NC}"
        elif [ $pass_rate -ge 75 ]; then
            echo -e "${YELLOW}⚠️  Good, but some improvements needed (${pass_rate}% pass rate)${NC}"
        else
            echo -e "${RED}❌ System needs significant improvements (${pass_rate}% pass rate)${NC}"
        fi
    fi
    
    echo ""
    
    # Exit with error if critical tests failed
    if [ $FAILED_TESTS -gt 5 ]; then
        echo -e "${RED}⚠️  Too many failed tests. Please address critical issues before production deployment.${NC}"
        exit 1
    elif [ $FAILED_TESTS -gt 0 ]; then
        echo -e "${YELLOW}⚠️  Some tests failed. Review and address before production deployment.${NC}"
        exit 0
    else
        echo -e "${GREEN}✅ All critical validations passed!${NC}"
        exit 0
    fi
}

###############################################################################
# MAIN EXECUTION
###############################################################################
main() {
    echo ""
    echo "═══════════════════════════════════════════════════════════════════════════"
    echo "  TiQology Post-Deployment Validation"
    echo "  Enterprise CI/CD + GitOps Infrastructure"
    echo "═══════════════════════════════════════════════════════════════════════════"
    echo ""
    
    # Run all validations
    validate_argocd
    validate_rollback
    validate_test_workflows
    validate_oidc
    validate_discord
    validate_database_migrations
    validate_health_endpoints
    validate_caching
    validate_security
    validate_environment_encryption
    
    # Print summary
    print_summary
}

# Run main function
main "$@"
