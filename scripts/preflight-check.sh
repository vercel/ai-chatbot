#!/bin/bash
# TiQology Pre-Flight Deployment Check

set -e

echo "🔍 TiQology Pre-Flight Check Starting..."
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0

# Check 1: Docker
echo -n "Checking Docker... "
if command -v docker &> /dev/null; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}✗ Docker not installed${NC}"
    ERRORS=$((ERRORS + 1))
fi

# Check 2: Docker running
echo -n "Checking Docker daemon... "
if docker info &> /dev/null; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}✗ Docker daemon not running${NC}"
    ERRORS=$((ERRORS + 1))
fi

# Check 3: Kubernetes (optional for local)
echo -n "Checking kubectl... "
if command -v kubectl &> /dev/null; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${YELLOW}⚠ kubectl not installed (optional)${NC}"
fi

# Check 4: Docker Compose
echo -n "Checking docker-compose... "
if command -v docker-compose &> /dev/null || docker compose version &> /dev/null; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}✗ docker-compose not available${NC}"
    ERRORS=$((ERRORS + 1))
fi

# Check 5: Required files
echo -n "Checking Docker files... "
if [[ -f "docker/voice-engine.Dockerfile" ]] && \
   [[ -f "docker/video-engine.Dockerfile" ]] && \
   [[ -f "docker/inference-engine.Dockerfile" ]]; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}✗ Docker files missing${NC}"
    ERRORS=$((ERRORS + 1))
fi

# Check 6: Python service files
echo -n "Checking Python services... "
if [[ -f "services/voice-engine/voice_engine.py" ]]; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}✗ Python service files missing${NC}"
    ERRORS=$((ERRORS + 1))
fi

# Check 7: Environment variables
echo -n "Checking environment variables... "
if [[ -n "$SUPABASE_URL" ]] && [[ -n "$SUPABASE_SERVICE_KEY" ]]; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${YELLOW}⚠ SUPABASE credentials not set${NC}"
fi

# Check 8: Disk space
echo -n "Checking disk space... "
AVAILABLE=$(df -BG . | tail -1 | awk '{print $4}' | sed 's/G//')
if [[ $AVAILABLE -gt 20 ]]; then
    echo -e "${GREEN}✓ ${AVAILABLE}GB available${NC}"
else
    echo -e "${RED}✗ Only ${AVAILABLE}GB available (need 20GB+)${NC}"
    ERRORS=$((ERRORS + 1))
fi

# Check 9: Port availability
echo -n "Checking port availability... "
PORTS_OK=true
for port in 8000 8001 8002; do
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo -e "${RED}✗ Port $port is already in use${NC}"
        PORTS_OK=false
        ERRORS=$((ERRORS + 1))
    fi
done
if $PORTS_OK; then
    echo -e "${GREEN}✓${NC}"
fi

echo ""
echo "================================"

if [[ $ERRORS -eq 0 ]]; then
    echo -e "${GREEN}✅ All checks passed! Ready for deployment.${NC}"
    exit 0
else
    echo -e "${RED}❌ $ERRORS error(s) found. Please fix before deploying.${NC}"
    exit 1
fi
