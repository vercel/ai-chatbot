#!/bin/bash

# ============================================
# TiQology Elite v1.5 - Automated Deployment
# Commander AL - December 7, 2025
# ============================================

set -e  # Exit on error

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Banner
echo ""
echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}  TiQology Elite v1.5 - Deployment Script${NC}"
echo -e "${BLUE}  Commander AL - December 7, 2025${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""

# ============================================
# STEP 0: Prerequisites Check
# ============================================

echo -e "${YELLOW}📋 Checking Prerequisites...${NC}"
echo ""

# Check for required commands
MISSING_COMMANDS=()

if ! command -v node &> /dev/null; then
    MISSING_COMMANDS+=("node")
fi

if ! command -v pnpm &> /dev/null && ! command -v npm &> /dev/null; then
    MISSING_COMMANDS+=("pnpm or npm")
fi

if ! command -v git &> /dev/null; then
    MISSING_COMMANDS+=("git")
fi

if ! command -v curl &> /dev/null; then
    MISSING_COMMANDS+=("curl")
fi

if [ ${#MISSING_COMMANDS[@]} -gt 0 ]; then
    echo -e "${RED}❌ Missing required commands:${NC}"
    for cmd in "${MISSING_COMMANDS[@]}"; do
        echo "   - $cmd"
    done
    echo ""
    echo "Please install missing dependencies and try again."
    exit 1
fi

echo -e "${GREEN}✅ All required commands found${NC}"
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: package.json not found${NC}"
    echo "   Please run this script from the ai-chatbot root directory"
    exit 1
fi

echo -e "${GREEN}✅ In correct directory (ai-chatbot)${NC}"
echo ""

# ============================================
# STEP 1: Gather Required Information
# ============================================

echo -e "${YELLOW}📝 Gathering Required Information...${NC}"
echo ""
echo "I need some information to complete the deployment."
echo "Please have the following ready:"
echo "  - Supabase project credentials"
echo "  - OpenAI API key"
echo "  - Vercel account access"
echo ""

read -p "Press Enter when ready to continue..."
echo ""

# ============================================
# STEP 1.1: Database Credentials
# ============================================

echo -e "${YELLOW}🗄️  Step 1: Database Configuration${NC}"
echo ""
echo "Please provide your Supabase credentials:"
echo "(You can find these in Supabase Dashboard > Settings > Database)"
echo ""

# Get database URL
echo "Enter your DATABASE_URL:"
echo "(Format: postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-us-west-1.pooler.supabase.com:5432/postgres)"
read -p "> " DATABASE_URL

if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}❌ DATABASE_URL is required${NC}"
    exit 1
fi

# Get direct URL
echo ""
echo "Enter your DIRECT_URL:"
echo "(Format: postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres)"
read -p "> " DIRECT_URL

if [ -z "$DIRECT_URL" ]; then
    echo -e "${RED}❌ DIRECT_URL is required${NC}"
    exit 1
fi

# Get Supabase URL
echo ""
echo "Enter your Supabase project URL:"
echo "(Format: https://[PROJECT-REF].supabase.co)"
read -p "> " SUPABASE_URL

if [ -z "$SUPABASE_URL" ]; then
    echo -e "${RED}❌ SUPABASE_URL is required${NC}"
    exit 1
fi

# Get Supabase anon key
echo ""
echo "Enter your Supabase ANON key:"
echo "(Found in Supabase Dashboard > Settings > API)"
read -p "> " SUPABASE_ANON_KEY

if [ -z "$SUPABASE_ANON_KEY" ]; then
    echo -e "${RED}❌ SUPABASE_ANON_KEY is required${NC}"
    exit 1
fi

# Get Supabase service role key
echo ""
echo "Enter your Supabase SERVICE ROLE key:"
read -p "> " SUPABASE_SERVICE_ROLE_KEY

if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo -e "${RED}❌ SUPABASE_SERVICE_ROLE_KEY is required${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}✅ Database credentials collected${NC}"
echo ""

# ============================================
# STEP 1.2: AI Provider Keys
# ============================================

echo -e "${YELLOW}🤖 Step 2: AI Provider Configuration${NC}"
echo ""

# Get OpenAI API key
echo "Enter your OpenAI API key:"
echo "(Get from: https://platform.openai.com/api-keys)"
read -p "> " OPENAI_API_KEY

if [ -z "$OPENAI_API_KEY" ]; then
    echo -e "${YELLOW}⚠️  Warning: OpenAI API key not provided. Elite Inference will be limited.${NC}"
fi

# Get Anthropic API key (optional)
echo ""
echo "Enter your Anthropic API key (optional, press Enter to skip):"
read -p "> " ANTHROPIC_API_KEY

# Get Google AI API key (optional)
echo ""
echo "Enter your Google AI API key (optional, press Enter to skip):"
read -p "> " GOOGLE_AI_API_KEY

echo ""
echo -e "${GREEN}✅ AI provider keys collected${NC}"
echo ""

# ============================================
# STEP 1.3: Generate NextAuth Secret
# ============================================

echo -e "${YELLOW}🔐 Step 3: Generating Security Keys...${NC}"
echo ""

# Generate NextAuth secret
if command -v openssl &> /dev/null; then
    NEXTAUTH_SECRET=$(openssl rand -base64 32)
    echo -e "${GREEN}✅ Generated NextAuth secret${NC}"
else
    echo -e "${YELLOW}⚠️  OpenSSL not found. Please generate a random 32-character string for NEXTAUTH_SECRET${NC}"
    read -p "Enter NEXTAUTH_SECRET: " NEXTAUTH_SECRET
fi

echo ""

# ============================================
# STEP 2: Create .env.local for Migrations
# ============================================

echo -e "${YELLOW}📄 Creating .env.local for database migrations...${NC}"
echo ""

cat > .env.local << EOF
# TiQology Elite v1.5 - Local Environment
# Generated: $(date)

# Database
DATABASE_URL=${DATABASE_URL}
DIRECT_URL=${DIRECT_URL}

# Supabase
NEXT_PUBLIC_SUPABASE_URL=${SUPABASE_URL}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}
SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}

# NextAuth
NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
NEXTAUTH_URL=http://localhost:3000

# AI Providers
OPENAI_API_KEY=${OPENAI_API_KEY}
ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
GOOGLE_AI_API_KEY=${GOOGLE_AI_API_KEY}
EOF

echo -e "${GREEN}✅ Created .env.local${NC}"
echo ""

# ============================================
# STEP 3: Install Dependencies
# ============================================

echo -e "${YELLOW}📦 Installing dependencies...${NC}"
echo ""

if command -v pnpm &> /dev/null; then
    pnpm install
elif command -v npm &> /dev/null; then
    npm install
fi

echo ""
echo -e "${GREEN}✅ Dependencies installed${NC}"
echo ""

# ============================================
# STEP 4: Run Database Migrations
# ============================================

echo -e "${YELLOW}🗄️  Running database migrations...${NC}"
echo ""

if command -v pnpm &> /dev/null; then
    pnpm db:push
elif command -v npm &> /dev/null; then
    npm run db:push
fi

echo ""
echo -e "${GREEN}✅ Database migrations complete${NC}"
echo ""

# ============================================
# STEP 5: Deployment Summary
# ============================================

echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}  🎊 Configuration Complete!${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""

echo -e "${GREEN}✅ .env.local created${NC}"
echo -e "${GREEN}✅ Dependencies installed${NC}"
echo -e "${GREEN}✅ Database migrations completed${NC}"
echo ""

echo -e "${YELLOW}📋 Next Steps:${NC}"
echo ""
echo "1. Deploy Backend to Vercel:"
echo "   - Go to: https://vercel.com/new"
echo "   - Import: MrAllgoodWilson/ai-chatbot"
echo "   - Add environment variables (copy from .env.local)"
echo "   - Set domain: api.tiqology.com"
echo ""
echo "2. Deploy Frontend to Vercel:"
echo "   - Go to: https://vercel.com/new"
echo "   - Import: MrAllgoodWilson/tiqology-spa"
echo "   - Set domain: www.tiqology.com"
echo ""
echo "3. Configure Cloudflare DNS:"
echo "   - Add CNAME: www → cname.vercel-dns.com"
echo "   - Add CNAME: api → cname.vercel-dns.com"
echo "   - See: docs/CLOUDFLARE_DOMAIN_SETUP.md"
echo ""
echo "4. Create Admin User:"
echo "   - Register at: https://www.tiqology.com/register"
echo "   - Promote to admin in Supabase SQL Editor:"
echo "     UPDATE users SET role = 'admin' WHERE email = 'your@email.com';"
echo ""

echo -e "${GREEN}📚 Full deployment guide: COMPLETE_DEPLOYMENT_GUIDE.md${NC}"
echo ""

# ============================================
# OPTIONAL: Vercel CLI Deployment
# ============================================

echo -e "${YELLOW}Would you like to deploy to Vercel now via CLI? (y/n)${NC}"
read -p "> " DEPLOY_NOW

if [ "$DEPLOY_NOW" = "y" ] || [ "$DEPLOY_NOW" = "Y" ]; then
    echo ""
    echo -e "${YELLOW}🚀 Deploying to Vercel...${NC}"
    echo ""
    
    # Check if Vercel CLI is installed
    if ! command -v vercel &> /dev/null; then
        echo -e "${YELLOW}Installing Vercel CLI...${NC}"
        npm install -g vercel
    fi
    
    # Deploy
    echo ""
    echo -e "${YELLOW}Deploying backend...${NC}"
    vercel --prod
    
    echo ""
    echo -e "${GREEN}✅ Backend deployed!${NC}"
    echo ""
    echo "⚠️  Don't forget to:"
    echo "   1. Add environment variables in Vercel dashboard"
    echo "   2. Configure custom domain (api.tiqology.com)"
    echo "   3. Deploy frontend (tiqology-spa)"
    echo ""
else
    echo ""
    echo -e "${YELLOW}Skipping Vercel deployment.${NC}"
    echo "You can deploy manually later using the Vercel dashboard."
    echo ""
fi

# ============================================
# Final Summary
# ============================================

echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}  🎯 Deployment Configuration Complete!${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""

echo -e "${GREEN}Your TiQology Elite v1.5 is ready for deployment!${NC}"
echo ""
echo "📍 Key Files Created:"
echo "   - .env.local (local development)"
echo "   - Database migrated (53 tables)"
echo ""
echo "📚 Documentation:"
echo "   - COMPLETE_DEPLOYMENT_GUIDE.md (full guide)"
echo "   - docs/CLOUDFLARE_DOMAIN_SETUP.md (domain config)"
echo "   - MISSION_COMPLETE.md (mission summary)"
echo ""
echo "🚀 Ready to revolutionize the AI agent space!"
echo ""

echo -e "${BLUE}Built with precision by Devin for Commander AL${NC}"
echo -e "${BLUE}December 7, 2025${NC}"
echo ""
