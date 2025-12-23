#!/bin/bash

# TiQology CI/CD Setup Script
# This script helps configure the GitHub repository for CI/CD

set -e

echo "🚀 TiQology CI/CD Setup"
echo "======================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
    echo -e "${RED}❌ GitHub CLI (gh) is not installed${NC}"
    echo "Install it from: https://cli.github.com/"
    exit 1
fi

# Check if logged in
if ! gh auth status &> /dev/null; then
    echo -e "${YELLOW}⚠️  Not logged in to GitHub CLI${NC}"
    echo "Run: gh auth login"
    exit 1
fi

echo -e "${GREEN}✅ GitHub CLI is installed and authenticated${NC}"
echo ""

# Get repository info
REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner)
echo "Repository: $REPO"
echo ""

# Function to set secret
set_secret() {
    local secret_name=$1
    local secret_description=$2
    local is_required=$3
    
    echo -e "${YELLOW}Setting: ${secret_name}${NC}"
    echo "Description: ${secret_description}"
    
    if [ "$is_required" = "true" ]; then
        echo -e "${RED}(Required)${NC}"
    else
        echo "(Optional)"
    fi
    
    read -p "Enter value (or press Enter to skip): " secret_value
    
    if [ -n "$secret_value" ]; then
        echo "$secret_value" | gh secret set "$secret_name"
        echo -e "${GREEN}✅ Secret set: ${secret_name}${NC}"
    else
        if [ "$is_required" = "true" ]; then
            echo -e "${YELLOW}⚠️  Skipped required secret: ${secret_name}${NC}"
        else
            echo "⏭️  Skipped optional secret: ${secret_name}"
        fi
    fi
    echo ""
}

echo "📝 Setting up GitHub Secrets"
echo "============================="
echo ""

# Required secrets
echo -e "${GREEN}Required Secrets:${NC}"
echo ""

set_secret "VERCEL_TOKEN" "Vercel authentication token (get from: https://vercel.com/account/tokens)" "true"
set_secret "VERCEL_ORG_ID" "Vercel organization ID (found in project settings)" "true"
set_secret "VERCEL_PROJECT_ID" "Vercel project ID (found in project settings)" "true"
set_secret "PRODUCTION_DATABASE_URL" "PostgreSQL connection string for production" "true"

echo ""
echo -e "${YELLOW}Optional Secrets:${NC}"
echo ""

set_secret "CLOUDFLARE_ZONE_ID" "Cloudflare zone ID for DNS management" "false"
set_secret "CLOUDFLARE_API_TOKEN" "Cloudflare API token" "false"
set_secret "DOCKER_USERNAME" "Docker Hub username" "false"
set_secret "DOCKER_PASSWORD" "Docker Hub password or token" "false"

echo ""
echo "🌍 Creating GitHub Environments"
echo "==============================="
echo ""

# Create environments
environments=("development" "staging" "production")

for env in "${environments[@]}"; do
    echo "Creating environment: $env"
    gh api \
        --method PUT \
        -H "Accept: application/vnd.github+json" \
        "/repos/$REPO/environments/$env" \
        -f "wait_timer=0" \
        2>/dev/null && echo -e "${GREEN}✅ Created: $env${NC}" || echo -e "${YELLOW}⚠️  Environment may already exist: $env${NC}"
done

echo ""
echo "🔒 Configuring Branch Protection"
echo "================================="
echo ""

# Function to configure branch protection
configure_branch_protection() {
    local branch=$1
    local require_reviews=$2
    
    echo "Configuring protection for branch: $branch"
    
    gh api \
        --method PUT \
        -H "Accept: application/vnd.github+json" \
        "/repos/$REPO/branches/$branch/protection" \
        -f "required_status_checks[strict]=true" \
        -f "required_status_checks[contexts][]=quality-check" \
        -f "required_status_checks[contexts][]=test" \
        -f "required_status_checks[contexts][]=build" \
        -f "enforce_admins=false" \
        -f "required_pull_request_reviews[dismiss_stale_reviews]=true" \
        -f "required_pull_request_reviews[require_code_owner_reviews]=false" \
        -f "required_pull_request_reviews[required_approving_review_count]=$require_reviews" \
        -f "restrictions=null" \
        2>/dev/null && echo -e "${GREEN}✅ Protected: $branch${NC}" || echo -e "${YELLOW}⚠️  Could not protect branch: $branch${NC}"
}

# Protect main branch (requires 1 review)
configure_branch_protection "main" 1

# Protect develop branch (no review required)
configure_branch_protection "develop" 0

echo ""
echo "⚙️  Configuring GitHub Actions Settings"
echo "========================================"
echo ""

# Enable GitHub Actions
gh api \
    --method PUT \
    -H "Accept: application/vnd.github+json" \
    "/repos/$REPO/actions/permissions" \
    -f "enabled=true" \
    -f "allowed_actions=all" \
    2>/dev/null && echo -e "${GREEN}✅ GitHub Actions enabled${NC}" || echo -e "${YELLOW}⚠️  Could not configure GitHub Actions${NC}"

echo ""
echo "✅ Setup Complete!"
echo "=================="
echo ""
echo -e "${GREEN}Your CI/CD pipeline is now configured!${NC}"
echo ""
echo "📚 Next Steps:"
echo "1. Review the secrets you've set: gh secret list"
echo "2. Check the workflows: .github/workflows/"
echo "3. Read the documentation: docs/CI-CD-PIPELINE.md"
echo "4. Make a commit to trigger the pipeline"
echo ""
echo "🚀 Ready to deploy!"
echo ""
echo "Documentation:"
echo "  - Complete Guide: docs/CI-CD-PIPELINE.md"
echo "  - Quick Reference: docs/CI-CD-QUICK-REFERENCE.md"
echo "  - Setup Summary: CI-CD-SETUP.md"
echo ""
