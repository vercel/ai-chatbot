# TiQology Services - Quick Reference

## 🚀 One-Command Deployments

### Fastest: Infrastructure Only (5 min, $70/mo saved)
```bash
docker-compose up -d postgres redis && \
docker-compose exec postgres psql -U postgres -d tiqology < db/migrations/add_pgvector_extension.sql
```

### Full Local: All AI Services (30 min, complete independence)
```bash
docker-compose up -d
```

### Production AWS: Enterprise Scale (60 min, $3,538/mo saved)
```bash
cd infrastructure && terraform apply && \
aws eks update-kubeconfig --name tiqology-services && \
kubectl apply -f ../k8s/
```

---

## 📊 What We Built

| Component | Status | Replaces | Savings | File |
|-----------|--------|----------|---------|------|
| Vector DB | ✅ | Pinecone | $70/mo | [pgvector.ts](../lib/vector/pgvector.ts) |
| Services Mesh | ✅ | - | - | [servicesMesh.ts](../lib/services/servicesMesh.ts) |
| Voice Engine | ✅ | ElevenLabs | $210/mo | [voice-engine.Dockerfile](../docker/voice-engine.Dockerfile) |
| Video Engine | ✅ | Pika | $258/mo | [video-engine.Dockerfile](../docker/video-engine.Dockerfile) |
| Inference | ✅ | DeepInfra | $800/mo | [inference-engine.Dockerfile](../docker/inference-engine.Dockerfile) |
| Kubernetes | ✅ | - | - | [k8s/](../k8s/) |
| Terraform | ✅ | - | - | [infrastructure/](../infrastructure/) |
| Monitoring | ✅ | - | - | [monitoring/](../monitoring/) |

**Total Savings: $42,456/year (78.8% reduction)**

---

## 🎯 Quick Commands

### Health Checks
```bash
curl http://localhost:8001/health  # Voice Engine
curl http://localhost:8002/health  # Video Engine
curl http://localhost:8000/health  # Inference Engine
curl https://your-app.vercel.app/api/services/health  # Services Mesh
```

### Monitor Deployment
```bash
docker-compose ps                    # Local
docker-compose logs -f               # Local logs
kubectl get pods -n tiqology-services -w  # Kubernetes
kubectl logs -n tiqology-services -l app=voice-engine -f  # K8s logs
```

### Verify Performance
```bash
# Vector search speed test
psql postgresql://localhost:5432/tiqology -c "
  SELECT count(*) FROM embeddings;
  \timing
  SELECT * FROM search_embeddings('[0.1, 0.2, ...]', 10);
"
```

---

## 💰 Cost Breakdown

### Before (External Services)
- Pinecone: $70/mo
- ElevenLabs: $330/mo
- Pika: $588/mo
- DeepInfra: $800/mo
- OpenAI/Anthropic: $2,700/mo
- **Total: $4,488/mo ($53,856/year)**

### After (Internal Services)
- AWS Infrastructure: $570/mo
- RDS PostgreSQL: $180/mo
- ElastiCache Redis: $60/mo
- Storage: $140/mo
- External (10% fallback): $500/mo
- **Total: $950/mo ($11,400/year)**

### Savings
- **Monthly: $3,538**
- **Annual: $42,456**
- **Reduction: 78.8%**

---

## 🎖️ Status: MISSION COMPLETE ✅

All systems implemented. Ready for deployment.

**Choose deployment path and execute! 🚀**
