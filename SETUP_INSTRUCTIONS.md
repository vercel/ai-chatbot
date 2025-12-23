# TiQology Setup Instructions

## 🚀 Quick Setup (5 minutes)

Follow these steps to get TiQology's full modular infrastructure running.

### Step 1: Install Dependencies

The dependencies are now configured in `package.json` as optional dependencies to avoid native compilation issues.

```bash
# Simply run install - optional dependencies will be installed automatically
pnpm install
```

If you encounter native compilation errors, you can skip optional dependencies:

```bash
pnpm install --no-optional
```

**Note**: The platform works without these packages by using browser-native APIs (WebGPU, WebXR) and fallbacks.

### Step 2: Environment Variables

Create `.env.local`:

```env
# AI Providers
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# Database
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
POSTGRES_URL=postgresql://postgres:[password]@db.xxx.supabase.co:5432/postgres

# Cloud Deployment
VERCEL_TOKEN=...
VERCEL_PROJECT_ID=prj_...
VERCEL_ORG_ID=team_...

# AWS (Optional - for quantum)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...

# Cloudflare (Optional - for CDN)
CLOUDFLARE_ACCOUNT_ID=...
CLOUDFLARE_API_TOKEN=...
CLOUDFLARE_ZONE_ID=...
```

### Step 3: Database Setup

```bash
# Run migrations
pnpm db:migrate

# Apply optimizations
node -e "
import { applyDatabaseOptimizations } from './lib/db/scalability';
import { db } from './lib/db';
await applyDatabaseOptimizations(db);
"
```

### Step 4: Test Components

```bash
# Start dev server
pnpm dev

# In another terminal, run tests
pnpm test
```

### Step 5: Access Features

Navigate to:
- **3D Rendering**: `/3d-demo`
- **VR Chat**: `/vr-chat`
- **Quantum Playground**: `/quantum`
- **AI Studio**: `/ai-studio`

## 📦 What's Included

✅ **High-Performance Rendering**
- WebGPU Engine: [lib/rendering/webgpu-engine.ts](lib/rendering/webgpu-engine.ts)
- Three.js Renderer: [lib/rendering/three-renderer.ts](lib/rendering/three-renderer.ts)

✅ **Holographic UI (WebXR)**
- Holographic Components: [lib/xr/holographic-ui.tsx](lib/xr/holographic-ui.tsx)
- Three Fiber Scenes: [lib/xr/three-fiber-scene.tsx](lib/xr/three-fiber-scene.tsx)

✅ **Quantum Computing**
- Compute Engine: [lib/quantum/compute-engine.ts](lib/quantum/compute-engine.ts)
- Supports: AWS Braket, Qiskit, Mock Simulator

✅ **AI Inference**
- Inference Pipeline: [lib/ai/inference-pipeline.ts](lib/ai/inference-pipeline.ts)
- GPU Acceleration: [lib/ai/gpu-acceleration.ts](lib/ai/gpu-acceleration.ts)

✅ **Cloud Orchestration**
- Multi-Cloud: [lib/cloud/orchestration.ts](lib/cloud/orchestration.ts)
- Vercel + Supabase + AWS + Cloudflare

✅ **Database Scalability**
- Optimization Config: [lib/db/scalability.ts](lib/db/scalability.ts)
- RLS Policies, Indexing, Monitoring

✅ **CI/CD Automation**
- Main Pipeline: [.github/workflows/ci-cd-pipeline.yml](.github/workflows/ci-cd-pipeline.yml)
- GPU Tests: [.github/workflows/gpu-tests.yml](.github/workflows/gpu-tests.yml)
- Quantum Tests: [.github/workflows/quantum-tests.yml](.github/workflows/quantum-tests.yml)

## 🎯 Usage Examples

### Render a 3D Scene

```tsx
import { ThreeFiberScene, Model3D } from '@/lib/xr/three-fiber-scene';

<ThreeFiberScene shadows>
  <Model3D url="/models/robot.glb" />
</ThreeFiberScene>
```

### Enter VR Mode

```tsx
import { HolographicUI, HolographicPanel } from '@/lib/xr/holographic-ui';

<HolographicUI enableVR>
  <HolographicPanel title="Dashboard">
    <YourContent />
  </HolographicPanel>
</HolographicUI>
```

### Run Quantum Circuit

```typescript
import { initializeQuantumEngine } from '@/lib/quantum/compute-engine';

const engine = await initializeQuantumEngine('mock');
const circuit = engine.createCircuit(3);
engine.addGate(circuit.id, { type: 'H', target: 0 });
const result = await engine.execute(circuit.id);
```

### AI Inference with Caching

```typescript
import { quickInfer } from '@/lib/ai/inference-pipeline';

const response = await quickInfer('Explain quantum computing', 'gpt-4');
console.log(response);
```

### GPU Matrix Multiply

```typescript
import { initializeGPUAccelerator } from '@/lib/ai/gpu-acceleration';

const gpu = await initializeGPUAccelerator();
const result = await gpu.matrixMultiply(tensorA, tensorB);
```

### Deploy to Production

```typescript
import { quickDeploy } from '@/lib/cloud/orchestration';

const deployment = await quickDeploy('production');
console.log('Deployed to:', deployment.url);
```

## 🔧 Configuration Options

### WebGPU Engine

```typescript
const engine = await initializeWebGPU({
  powerPreference: 'high-performance', // or 'low-power'
  antialias: true,
  samples: 4,
});
```

### Quantum Backend

```typescript
// Use AWS Braket (requires credentials)
const engine = await initializeQuantumEngine('aws-braket');

// Use mock simulator (no credentials needed)
const engine = await initializeQuantumEngine('mock');
```

### AI Inference

```typescript
const result = await pipeline.infer(prompt, {
  model: 'gpt-4',
  temperature: 0.7,
  maxTokens: 2048,
  cache: true,
  stream: false,
});
```

### GPU Acceleration

```typescript
const gpu = await initializeGPUAccelerator({
  mode: 'webgpu', // or 'gpu.js' or 'webgl'
  device: 'gpu', // or 'cpu'
});
```

## 📊 Monitoring

### Database Health

```typescript
import { DatabaseMonitor } from '@/lib/db/scalability';
import { db } from '@/lib/db';

const monitor = new DatabaseMonitor(db);
const metrics = await monitor.collectMetrics();
console.log(metrics);
```

### Cloud Services

```typescript
import { checkHealth } from '@/lib/cloud/orchestration';

const health = await checkHealth();
console.log('All systems:', health);
```

### Inference Stats

```typescript
import { getInferencePipeline } from '@/lib/ai/inference-pipeline';

const pipeline = getInferencePipeline();
const stats = pipeline.getStats();
console.log('Cache size:', stats.cacheSize);
```

## 🧪 Testing

```bash
# Run all tests
pnpm test

# Test specific module
pnpm test -- quantum
pnpm test -- gpu-acceleration
pnpm test -- webgpu-engine

# Run E2E tests
pnpm exec playwright test
```

## 📚 Documentation

- **Architecture Guide**: [TIQOLOGY_INFRASTRUCTURE_GUIDE.md](TIQOLOGY_INFRASTRUCTURE_GUIDE.md)
- **Integration Examples**: [TIQOLOGY_INTEGRATION_EXAMPLES.md](TIQOLOGY_INTEGRATION_EXAMPLES.md)
- **API Reference**: See individual module files

## 🐛 Troubleshooting

### WebGPU Not Available
- Check browser support: Chrome 113+, Edge 113+
- Falls back to Three.js automatically

### Quantum Engine Fails
- AWS Braket requires valid credentials
- Use 'mock' backend for development

### Build Errors
- Increase memory: `NODE_OPTIONS='--max-old-space-size=6144'`
- Clear cache: `pnpm clean && pnpm install`

### Database Connection Issues
- Verify POSTGRES_URL in .env.local
- Check Supabase project status
- Ensure connection pooling is configured

## 🚢 Deployment Checklist

- [ ] Environment variables set in Vercel
- [ ] Database migrations applied
- [ ] RLS policies enabled
- [ ] Cloudflare DNS configured
- [ ] CI/CD workflows enabled
- [ ] Performance monitoring active

## 🔐 Security Notes

- Never commit API keys to git
- Use GitHub Secrets for CI/CD
- Enable RLS on all Supabase tables
- Audit dependencies regularly (`pnpm audit`)
- Keep dependencies up to date

## 🎉 You're Ready!

Your TiQology infrastructure is now set up with:
- 🎨 3D rendering (WebGPU + Three.js)
- 🥽 Holographic UI (WebXR)
- ⚛️ Quantum computing (AWS Braket + Mock)
- 🤖 AI inference (OpenAI + Anthropic)
- ⚡ GPU acceleration
- ☁️ Multi-cloud orchestration
- 🗄️ Scalable database
- 🔄 Automated CI/CD

**Start building the future! 🚀**
