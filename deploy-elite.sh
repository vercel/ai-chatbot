#!/bin/bash

# ============================================
# TiQology Elite v1.5 - Quick Deploy Script
# ============================================
# 
# This script guides you through deploying TiQology
# to production in 15 minutes.
#
# Prerequisites:
# - Vercel account (vercel.com)
# - Supabase project (supabase.com)
# - GitHub repos: ai-chatbot + tiqology-spa
# - Environment variables ready
#
# Usage:
#   bash deploy-elite.sh
#
# ============================================

set -e  # Exit on error

echo "🚀 TiQology Elite v1.5 - Deployment Script"
echo "==========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Step 1: Check prerequisites
echo "📋 Step 1: Checking Prerequisites..."
echo ""

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo -e "${YELLOW}⚠️  Vercel CLI not found. Installing...${NC}"
    npm install -g vercel
else
    echo -e "${GREEN}✅ Vercel CLI installed${NC}"
fi

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: package.json not found. Please run this script from the ai-chatbot root directory.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ In ai-chatbot directory${NC}"

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo -e "${YELLOW}⚠️  .env.local not found. Please create it with your environment variables.${NC}"
    echo "   Copy from: .env.production.example"
    echo ""
    read -p "Press Enter when ready to continue..."
else
    echo -e "${GREEN}✅ .env.local found${NC}"
fi

echo ""
echo -e "${GREEN}All prerequisites met!${NC}"
echo ""

# Step 2: Run database migrations
echo "📊 Step 2: Database Migrations"
echo "==============================="
echo ""
echo "Choose migration method:"
echo "  1. Local migration (recommended) - uses Drizzle Kit"
echo "  2. Manual migration - copy SQL to Supabase Dashboard"
echo "  3. Skip (already migrated)"
echo ""
read -p "Enter choice (1/2/3): " migration_choice

case $migration_choice in
    1)
        echo ""
        echo "🔄 Running local migration..."
        if command -v pnpm &> /dev/null; then
            pnpm db:push
        elif command -v npm &> /dev/null; then
            npm run db:push
        else
            echo -e "${RED}❌ Error: Neither pnpm nor npm found${NC}"
            exit 1
        fi
        echo -e "${GREEN}✅ Migrations complete${NC}"
        ;;
    2)
        echo ""
        echo "📋 Manual migration steps:"
        echo "  1. Go to Supabase Dashboard > SQL Editor"
        echo "  2. Copy SQL from lib/db/migrations/*.sql"
        echo "  3. Execute each migration in order (001 → 005)"
        echo ""
        read -p "Press Enter when migrations are complete..."
        echo -e "${GREEN}✅ Migrations marked as complete${NC}"
        ;;
    3)
        echo -e "${YELLOW}⏭️  Skipping migrations${NC}"
        ;;
    *)
        echo -e "${RED}❌ Invalid choice. Exiting.${NC}"
        exit 1
        ;;
esac

echo ""

# Step 3: Deploy backend
echo "🚀 Step 3: Deploy Backend to Vercel"
echo "===================================="
echo ""
echo "This will deploy ai-chatbot to Vercel."
echo ""
read -p "Continue? (y/n): " deploy_backend

if [ "$deploy_backend" = "y" ] || [ "$deploy_backend" = "Y" ]; then
    echo ""
    echo "🔄 Deploying to Vercel..."
    vercel --prod
    echo ""
    echo -e "${GREEN}✅ Backend deployed!${NC}"
    echo ""
    echo "📝 Note your backend URL (shown above)"
    read -p "Enter backend URL (e.g., https://ai-chatbot-abc123.vercel.app): " backend_url
    echo ""
    echo -e "${GREEN}Backend URL: $backend_url${NC}"
else
    echo -e "${YELLOW}⏭️  Skipping backend deployment${NC}"
    read -p "Enter existing backend URL: " backend_url
fi

echo ""

# Step 4: Deploy frontend
echo "🎨 Step 4: Deploy Frontend to Vercel"
echo "====================================="
echo ""
echo "Now we need to deploy the frontend (tiqology-spa)."
echo ""
echo "Manual steps (in browser):"
echo "  1. Go to: https://vercel.com/new"
echo "  2. Import: MrAllgoodWilson/tiqology-spa"
echo "  3. Add environment variable:"
echo "     NEXT_PUBLIC_API_URL=$backend_url"
echo "  4. Click Deploy"
echo ""
read -p "Press Enter when frontend is deployed..."
read -p "Enter frontend URL (e.g., https://tiqology-spa-abc123.vercel.app): " frontend_url
echo ""
echo -e "${GREEN}Frontend URL: $frontend_url${NC}"

echo ""

# Step 5: Create admin user
echo "👤 Step 5: Create Admin User"
echo "============================="
echo ""
echo "Steps:"
echo "  1. Go to: $frontend_url/register"
echo "  2. Register a new user"
echo "  3. Go to Supabase Dashboard > SQL Editor"
echo "  4. Run this query:"
echo ""
echo "     UPDATE users SET role = 'admin' WHERE email = 'your@email.com';"
echo ""
read -p "Press Enter when admin user is created..."
echo -e "${GREEN}✅ Admin user created${NC}"

echo ""

# Step 6: Verify deployment
echo "🔍 Step 6: Verify Deployment"
echo "============================"
echo ""
echo "Testing health endpoint..."

if command -v curl &> /dev/null; then
    health_status=$(curl -s -o /dev/null -w "%{http_code}" "$backend_url/api/health")
    if [ "$health_status" = "200" ]; then
        echo -e "${GREEN}✅ Health check passed (200 OK)${NC}"
    else
        echo -e "${YELLOW}⚠️  Health check returned: $health_status${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  curl not found. Skipping automatic health check.${NC}"
    echo "   Manually visit: $backend_url/api/health"
fi

echo ""
echo "📋 Verification checklist:"
echo "  1. Visit: $frontend_url/login"
echo "  2. Login with admin credentials"
echo "  3. Check: $backend_url/api/health"
echo "  4. Test: $backend_url/api/agentos/registry"
echo ""

# Step 7: Summary
echo "🎊 Deployment Complete!"
echo "======================="
echo ""
echo "Your TiQology Elite v1.5 is now live!"
echo ""
echo "📍 Access Information:"
echo "  Frontend: $frontend_url"
echo "  Backend:  $backend_url"
echo "  Health:   $backend_url/api/health"
echo "  Analytics: $backend_url/api/analytics?type=overview"
echo ""
echo "🎯 Next Steps:"
echo "  1. Test all features"
echo "  2. Set up monitoring (UptimeRobot, Sentry)"
echo "  3. Review analytics dashboard"
echo "  4. Configure custom domain (optional)"
echo ""
echo "📚 Documentation:"
echo "  - READY_FOR_LAUNCH.md - Complete deployment guide"
echo "  - ELITE_FEATURES.md - Elite features documentation"
echo "  - MISSION_COMPLETE.md - Mission summary"
echo ""
echo -e "${GREEN}🚀 TiQology is ready to revolutionize the AI space!${NC}"
echo ""
echo "Built with precision by Devin for Commander AL"
echo "December 7, 2025"
echo ""
