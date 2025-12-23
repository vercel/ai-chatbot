#!/bin/bash
# TiQology Local Deployment Script
# Deploys services using Docker Compose for local development/testing

set -e

echo "🚀 TiQology Local Deployment Starting..."
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Run pre-flight checks
echo -e "${BLUE}Running pre-flight checks...${NC}"
if bash scripts/preflight-check.sh; then
    echo ""
else
    echo ""
    echo "Pre-flight checks failed. Aborting deployment."
    exit 1
fi

# Build marker
echo -e "${BLUE}📦 Building Docker images (this may take 10-15 minutes)...${NC}"
echo ""

# Note: We'll start with just the infrastructure services for now
# Full AI services require large model downloads (20-50GB+)

# Start PostgreSQL with pgvector
echo -e "${BLUE}Starting PostgreSQL with pgvector...${NC}"
docker-compose up -d postgres

# Wait for PostgreSQL
echo -n "Waiting for PostgreSQL to be ready"
for i in {1..30}; do
    if docker-compose exec -T postgres pg_isready -U postgres &> /dev/null; then
        echo -e " ${GREEN}✓${NC}"
        break
    fi
    echo -n "."
    sleep 1
done

# Run pgvector migration
echo -e "${BLUE}Running pgvector migration...${NC}"
if [[ -f "db/migrations/add_pgvector_extension.sql" ]]; then
    docker-compose exec -T postgres psql -U postgres -d tiqology < db/migrations/add_pgvector_extension.sql
    echo -e "${GREEN}✓ pgvector migration complete${NC}"
fi

# Start Redis
echo -e "${BLUE}Starting Redis cache...${NC}"
docker-compose up -d redis

echo ""
echo -e "${GREEN}✅ Infrastructure services deployed!${NC}"
echo ""
echo "Services running:"
echo "  📊 PostgreSQL (pgvector): localhost:5432"
echo "  🗄️  Redis: localhost:6379"
echo ""
echo -e "${YELLOW}Note: Full AI services (Voice, Video, Inference) require:${NC}"
echo "  - 20-50GB disk space for models"
echo "  - 10-15 minutes for model downloads"
echo "  - GPU support for optimal performance"
echo ""
echo "To deploy full AI services, run:"
echo "  docker-compose up -d voice-engine video-engine inference-engine"
echo ""
echo "To check status:"
echo "  docker-compose ps"
echo ""
echo "To view logs:"
echo "  docker-compose logs -f postgres redis"
echo ""
echo -e "${GREEN}🎉 Deployment complete!${NC}"
