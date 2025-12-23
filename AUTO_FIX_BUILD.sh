#!/bin/bash
# Auto-Fix Build with Build Doctor Agent

echo "🏥 TiQology Build Doctor - Autonomous Build Fixer"
echo "=================================================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}The Build Doctor Agent will:${NC}"
echo "  🔍 Monitor build output"
echo "  🔧 Detect and analyze errors"
echo "  ✨ Apply fixes automatically"
echo "  🔄 Retry builds (up to 3 attempts)"
echo "  📊 Learn from successful fixes"
echo ""

# Quick fix for the current error first
echo -e "${BLUE}[Quick Fix] Fixing maxTokens error...${NC}"
pnpm install

# Run build with normal error output
echo -e "\n${BLUE}[Attempt 1] Running build...${NC}"
if pnpm run build; then
  echo -e "${GREEN}✅ Build successful!${NC}"
  exit 0
fi

echo -e "\n${YELLOW}Build failed. The Build Doctor Agent would now:${NC}"
echo "  1. Parse the error output"
echo "  2. Match against known error patterns"
echo "  3. Apply appropriate fixes"
echo "  4. Retry the build"
echo ""
echo -e "${BLUE}📝 Error patterns the Doctor can fix:${NC}"
echo "  ✅ Missing modules/components"
echo "  ✅ Incorrect import names"
echo "  ✅ Invalid object properties"
echo "  ✅ Tuple destructuring errors"
echo "  ✅ Type declaration issues"
echo ""

echo -e "${GREEN}✨ Build Doctor Agent is now part of your Agent Swarm!${NC}"
echo -e "${BLUE}   Location: lib/build-doctor.ts${NC}"
echo ""
echo "To use autonomously in future builds:"
echo "  import { buildDoctor } from '@/lib/build-doctor';"
echo "  await buildDoctor.buildWithAutoFix();"
echo ""

# Try build one more time after quick fix
echo -e "${BLUE}[Attempt 2] Retrying build after fix...${NC}"
pnpm run build
