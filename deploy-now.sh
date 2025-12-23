#!/bin/bash
# TiQology Deployment - Execute Now
# Quick deployment of infrastructure layer

echo "🚀 TiQology Deployment - EXECUTING NOW"
echo "========================================"
echo ""

# Check if we're in dev container
if [ -f "/.dockerenv" ]; then
    echo "✓ Running in dev container"
    echo ""
    
    # Option 1: Use existing docker-compose
    echo "📦 Deploying infrastructure services..."
    echo ""
    
    # Check if docker-compose exists
    if [ -f "docker-compose.yml" ]; then
        echo "Starting PostgreSQL with pgvector..."
        docker-compose up -d postgres
        
        echo "Waiting for PostgreSQL..."
        sleep 5
        
        echo "Starting Redis cache..."
        docker-compose up -d redis
        
        echo ""
        echo "✅ Infrastructure services deployed!"
        echo ""
        echo "Next steps:"
        echo "1. Apply pgvector migration:"
        echo "   docker-compose exec postgres psql -U postgres -d tiqology < db/migrations/add_pgvector_extension.sql"
        echo ""
        echo "2. Test Services Mesh:"
        echo "   curl http://localhost:3000/api/services/health"
        echo ""
        echo "3. Deploy to Vercel:"
        echo "   vercel deploy --prod"
    else
        echo "❌ docker-compose.yml not found"
        echo ""
        echo "Manual deployment steps:"
        echo ""
        echo "1. Start PostgreSQL:"
        echo "   docker run -d --name tiqology-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=tiqology -p 5432:5432 postgres:16-alpine"
        echo ""
        echo "2. Start Redis:"
        echo "   docker run -d --name tiqology-redis -p 6379:6379 redis:7-alpine"
        echo ""
        echo "3. Apply pgvector migration:"
        echo "   psql postgresql://postgres:postgres@localhost:5432/tiqology < db/migrations/add_pgvector_extension.sql"
    fi
else
    echo "Running outside container - checking for Kubernetes..."
    
    if command -v kubectl &> /dev/null; then
        echo "☸️  Kubernetes detected - deploying to cluster..."
        ./scripts/deploy-services.sh
    else
        echo "📦 Using Docker Compose for local deployment..."
        docker-compose up -d postgres redis
    fi
fi

echo ""
echo "🎉 Deployment initiated!"
echo ""
echo "Monitor with:"
echo "  docker-compose ps"
echo "  docker-compose logs -f"
