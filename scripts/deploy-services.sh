#!/bin/bash
# TiQology Services - Kubernetes Deployment Script

set -e

echo "🚀 TiQology Services Deployment Starting..."

# Check prerequisites
command -v kubectl >/dev/null 2>&1 || { echo "❌ kubectl not installed"; exit 1; }
command -v docker >/dev/null 2>&1 || { echo "❌ docker not installed"; exit 1; }

# Build Docker images
echo "📦 Building Docker images..."
docker build -f docker/voice-engine.Dockerfile -t tiqology/voice-engine:latest .
docker build -f docker/video-engine.Dockerfile -t tiqology/video-engine:latest .
docker build -f docker/inference-engine.Dockerfile -t tiqology/inference-engine:latest .

# Push to registry (update with your registry)
echo "📤 Pushing images to registry..."
# docker push tiqology/voice-engine:latest
# docker push tiqology/video-engine:latest
# docker push tiqology/inference-engine:latest

# Apply Kubernetes configs
echo "☸️  Applying Kubernetes configurations..."
kubectl apply -f k8s/namespace-and-config.yaml
kubectl apply -f k8s/voice-engine-deployment.yaml
kubectl apply -f k8s/video-engine-deployment.yaml
kubectl apply -f k8s/inference-engine-deployment.yaml

# Wait for deployments
echo "⏳ Waiting for deployments to be ready..."
kubectl wait --for=condition=available --timeout=600s \
  deployment/voice-engine -n tiqology-services || true

kubectl wait --for=condition=available --timeout=600s \
  deployment/inference-engine -n tiqology-services || true

# Check status
echo ""
echo "✅ Deployment Status:"
kubectl get pods -n tiqology-services
echo ""
kubectl get svc -n tiqology-services
echo ""

# Show logs
echo ""
echo "📝 Recent logs:"
kubectl logs -n tiqology-services -l app=voice-engine --tail=20 || true
echo ""

echo "🎉 TiQology Services Deployment Complete!"
echo ""
echo "Services available at:"
echo "  - Voice Engine: http://voice-engine-service:8001"
echo "  - Video Engine: http://video-engine-service:8002"
echo "  - Inference Engine: http://inference-engine-service:8000"
echo ""
echo "Monitor with:"
echo "  kubectl get pods -n tiqology-services -w"
echo "  kubectl logs -n tiqology-services -l app=voice-engine -f"
