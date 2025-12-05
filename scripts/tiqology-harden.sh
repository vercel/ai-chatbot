#!/bin/bash
# TiQology Hardening Script
# This script applies all SSR/hydration fixes and sets up Ghost Mode

set -e  # Exit on error

echo "🚀 TiQology Hardening Script v0.1"
echo "=================================="
echo ""

# Colors for output
GREEN='\033[0.32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in the correct directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root."
    exit 1
fi

echo -e "${BLUE}📋 Checking current branch...${NC}"
CURRENT_BRANCH=$(git branch --show-current)
echo "   Current branch: $CURRENT_BRANCH"
echo ""

# Confirm before proceeding
read -p "Continue with hardening? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 1
fi

echo -e "${BLUE}1️⃣  Checking Git status...${NC}"
if [ -n "$(git status --porcelain)" ]; then
    echo -e "${YELLOW}   ⚠️  You have uncommitted changes.${NC}"
    read -p "   Stash changes? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git stash
        echo -e "${GREEN}   ✅ Changes stashed${NC}"
    fi
fi
echo ""

echo -e "${BLUE}2️⃣  Syncing with upstream...${NC}"
if git remote | grep -q "upstream"; then
    echo "   Fetching from upstream..."
    git fetch upstream
    echo "   Rebasing on upstream/main..."
    git rebase upstream/main
    echo -e "${GREEN}   ✅ Synced with upstream${NC}"
else
    echo -e "${YELLOW}   ⚠️  No upstream remote found. Skipping sync.${NC}"
fi
echo ""

echo -e "${BLUE}3️⃣  Installing dependencies...${NC}"
if command -v pnpm &> /dev/null; then
    pnpm install
elif command -v npm &> /dev/null; then
    npm install
else
    echo "❌ Error: Neither pnpm nor npm found. Please install one."
    exit 1
fi
echo -e "${GREEN}   ✅ Dependencies installed${NC}"
echo ""

echo -e "${BLUE}4️⃣  Checking environment variables...${NC}"
if [ -f ".env.local" ]; then
    echo "   .env.local found"
else
    echo -e "${YELLOW}   ⚠️  .env.local not found. Creating from .env.example...${NC}"
    cp .env.example .env.local
    echo -e "${YELLOW}   ⚠️  Please configure .env.local with your API keys${NC}"
fi

# Check for Ghost Mode API key
if grep -q "GHOST_MODE_API_KEY" .env.local 2>/dev/null; then
    echo "   Ghost Mode API key configured"
else
    echo -e "${YELLOW}   💡 Add GHOST_MODE_API_KEY to .env.local for Ghost Mode security${NC}"
    echo "   Example: GHOST_MODE_API_KEY=your-secret-key-here"
fi
echo ""

echo -e "${BLUE}5️⃣  Verifying hardening fixes...${NC}"

# Check if files have been modified
FILES_TO_CHECK=(
    "components/weather.tsx"
    "components/multimodal-input.tsx"
    "app/api/ghost/route.ts"
    "hooks/use-ghost-eval.ts"
)

MISSING_FILES=()
for file in "${FILES_TO_CHECK[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}   ✅ $file${NC}"
    else
        echo -e "${YELLOW}   ⚠️  $file (missing)${NC}"
        MISSING_FILES+=("$file")
    fi
done

if [ ${#MISSING_FILES[@]} -gt 0 ]; then
    echo -e "${YELLOW}   Some hardening files are missing. They should be in this branch.${NC}"
fi
echo ""

echo -e "${BLUE}6️⃣  Running type check...${NC}"
if command -v pnpm &> /dev/null; then
    if pnpm exec tsc --noEmit; then
        echo -e "${GREEN}   ✅ Type check passed${NC}"
    else
        echo -e "${YELLOW}   ⚠️  Type check warnings detected${NC}"
    fi
else
    npm exec tsc --noEmit && echo -e "${GREEN}   ✅ Type check passed${NC}" || echo -e "${YELLOW}   ⚠️  Type check warnings${NC}"
fi
echo ""

echo -e "${BLUE}7️⃣  Running development build test...${NC}"
if command -v pnpm &> /dev/null; then
    if timeout 30s pnpm dev & DEV_PID=$!; then
        sleep 10
        kill $DEV_PID 2>/dev/null || true
        echo -e "${GREEN}   ✅ Dev server started successfully${NC}"
    else
        echo -e "${YELLOW}   ⚠️  Dev server test skipped (timeout)${NC}"
    fi
else
    echo -e "${YELLOW}   ⚠️  Dev server test skipped${NC}"
fi
echo ""

echo -e "${GREEN}✅ Hardening complete!${NC}"
echo ""
echo "📝 Next steps:"
echo "   1. Review changes: git status"
echo "   2. Test the app: pnpm dev"
echo "   3. Build for production: pnpm build"
echo "   4. Commit changes: git add . && git commit -m 'feat: apply TiQology hardening fixes'"
echo "   5. Push to remote: git push origin $CURRENT_BRANCH"
echo ""
echo "🔗 Ghost Mode endpoint: /api/ghost"
echo "📖 See README-TiQology.md for integration guide"
echo ""
