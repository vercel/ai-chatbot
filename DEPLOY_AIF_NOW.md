# 🚀 TiQology AIF - DEPLOYMENT COMMANDS

## Execute These Commands Now:

### Step 1: Make Scripts Executable
```bash
chmod +x scripts/deploy-aif.sh
```

### Step 2: Run Deployment Script
```bash
./scripts/deploy-aif.sh
```

**OR run commands manually:**

### Manual Deployment Steps:

#### 1. Apply Database Migration
```bash
psql "$POSTGRES_URL" -f db/migrations/add_aif_tables.sql
```

#### 2. Install Dependencies (if needed)
```bash
pnpm install
```

#### 3. Build Application
```bash
NODE_OPTIONS="--max-old-space-size=6144" pnpm run build
```

#### 4. Deploy to Vercel
```bash
vercel --prod
```

**OR start locally:**
```bash
pnpm start
```

---

## 🔐 Required Environment Variables

Make sure these are set in `.env.local` or Vercel dashboard:

### Required:
```bash
POSTGRES_URL=postgresql://postgres:GZGLrGQV4bGRdrTZ@db.iomzbddkmykfruslybxq.supabase.co:5432/postgres
AUTH_SECRET=your_auth_secret
OPENAI_API_KEY=your_openai_key
```

### Optional (for full AIF features):
```bash
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password
ENCRYPTION_KEY=your_32_byte_hex_key
HASH_SALT=your_16_byte_hex_salt
```

---

## 🎯 What Gets Deployed

### AIF Components:
✅ Neural Mesh Layer - Real-time coordination  
✅ Agent Swarm - 12 specialized agents  
✅ Privacy Mesh - GDPR/CCPA/SOC2/HIPAA compliance  
✅ Model Auto-Optimizer - Continuous improvement  

### Database Tables (12 new):
- privacy_consents, privacy_audit_logs
- model_metrics, prompt_performance, prompt_variants
- hyperparameter_configs, model_recommendations
- agent_tasks
- neural_mesh_nodes, neural_mesh_messages
- system_health_snapshots
- optimization_recommendations

---

## 📊 Post-Deployment

### Start Neural Mesh (in your application):
```typescript
import { neuralMesh } from '@/lib/neural-mesh';
await neuralMesh.startWebSocketServer(8080);
```

### Start Model Optimizer:
```typescript
import { modelOptimizer } from '@/lib/model-optimizer';
await modelOptimizer.start();
```

### Test Agent Swarm:
```typescript
import { agentSwarm } from '@/lib/agent-swarm';
const taskId = await agentSwarm.submitTask('text-analysis', { text: 'test' }, 'high');
```

---

## ✨ Ready to Launch!

Your TiQology Autonomous Intelligence Fabric is production-ready!

📖 Full documentation: `docs/AIF_IMPLEMENTATION_COMPLETE.md`
