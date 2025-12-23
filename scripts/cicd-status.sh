#!/bin/bash

# CI/CD Pipeline Visualization and Status Check

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║        TiQology CI/CD Pipeline - Status Dashboard            ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}📦 Pipeline Components:${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

components=(
    "ci-cd-pipeline.yml:Main deployment pipeline"
    "preview-deployment.yml:PR preview deployments"
    "security-analysis.yml:Security scanning"
    "dependency-updates.yml:Automated updates"
)

for component in "${components[@]}"; do
    IFS=':' read -r file description <<< "$component"
    if [ -f ".github/workflows/$file" ]; then
        echo -e "  ${GREEN}✓${NC} $file"
        echo "    └─ $description"
    else
        echo -e "  ${YELLOW}✗${NC} $file (not found)"
    fi
done

echo ""
echo -e "${BLUE}📄 Documentation:${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

docs=(
    "docs/CI-CD-PIPELINE.md:Complete pipeline documentation"
    "docs/CI-CD-QUICK-REFERENCE.md:Quick reference guide"
    "CI-CD-SETUP.md:Setup instructions"
)

for doc in "${docs[@]}"; do
    IFS=':' read -r file description <<< "$doc"
    if [ -f "$file" ]; then
        echo -e "  ${GREEN}✓${NC} $file"
        echo "    └─ $description"
    else
        echo -e "  ${YELLOW}✗${NC} $file (not found)"
    fi
done

echo ""
echo -e "${BLUE}🐳 Docker Configuration:${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

docker_files=(
    "Dockerfile:Production container"
    ".dockerignore:Docker ignore patterns"
    "docker-compose.yml:Local development setup"
)

for file in "${docker_files[@]}"; do
    IFS=':' read -r filename description <<< "$file"
    if [ -f "$filename" ]; then
        echo -e "  ${GREEN}✓${NC} $filename"
        echo "    └─ $description"
    else
        echo -e "  ${YELLOW}✗${NC} $filename (not found)"
    fi
done

echo ""
echo -e "${BLUE}🔧 Setup Scripts:${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ -f "scripts/setup-cicd.sh" ]; then
    echo -e "  ${GREEN}✓${NC} scripts/setup-cicd.sh"
    echo "    └─ Automated setup script"
else
    echo -e "  ${YELLOW}✗${NC} scripts/setup-cicd.sh (not found)"
fi

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                     Pipeline Flow                             ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
echo "  Push/PR"
echo "     ↓"
echo "  ┌──────────────┐"
echo "  │    Setup     │ ← Cache dependencies"
echo "  └──────┬───────┘"
echo "         ↓"
echo "  ┌──────────────────────────────────┐"
echo "  │   Parallel Quality & Security     │"
echo "  ├────────┬─────────┬───────────────┤"
echo "  │ Lint   │ Tests   │ Security Scan │"
echo "  └────┬───┴────┬────┴────┬──────────┘"
echo "       └────────┴─────────┘"
echo "              ↓"
echo "       ┌──────────┐"
echo "       │  Build   │"
echo "       └─────┬────┘"
echo "             ↓"
echo "  ┌──────────────────────┐"
echo "  │  Deploy Environments  │"
echo "  ├──────┬───────┬───────┤"
echo "  │ Dev  │Staging│  Prod │"
echo "  └──────┴───────┴───────┘"
echo "             ↓"
echo "  ┌──────────────────────┐"
echo "  │  Post-Deployment     │"
echo "  ├──────┬───────┬───────┤"
echo "  │  DB  │ Perf  │Health │"
echo "  └──────┴───────┴───────┘"
echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                     Quick Commands                            ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
echo "Setup Pipeline:"
echo "  $ ./scripts/setup-cicd.sh"
echo ""
echo "Check Status:"
echo "  $ gh run list --workflow=ci-cd-pipeline.yml"
echo ""
echo "Manual Deploy:"
echo "  $ gh workflow run ci-cd-pipeline.yml -f environment=production"
echo ""
echo "Local Development:"
echo "  $ docker-compose up -d"
echo ""
echo "Run Tests:"
echo "  $ pnpm lint && pnpm test && pnpm build"
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo ""
