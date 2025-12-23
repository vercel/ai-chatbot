# TiQology Quick Reference Card

## 🚀 Instant Usage Guide

### Import & Initialize

```typescript
// Initialize everything at once
import { initializeTiQology } from '@/lib/tiqology-index';

const tiqology = await initializeTiQology({
  rendering: 'auto',  // or 'webgpu' | 'three'
  quantum: 'mock',    // or 'aws-braket' | 'qiskit'
  gpu: 'webgpu',      // or 'gpu.js' | 'webgl'
});
```

### 3D Rendering

```typescript
// WebGPU
import { initializeWebGPU } from '@/lib/rendering/webgpu-engine';
const engine = await initializeWebGPU();

// Three.js
import { initializeThreeRenderer } from '@/lib/rendering/three-renderer';
const renderer = await initializeThreeRenderer();
```

### Holographic UI (XR)

```tsx
import { HolographicUI, HolographicPanel } from '@/lib/xr/holographic-ui';

<HolographicUI enableVR>
  <HolographicPanel position={[0, 1.6, -2]} title="Dashboard">
    <YourContent />
  </HolographicPanel>
</HolographicUI>
```

### Quantum Computing

```typescript
import { initializeQuantumEngine } from '@/lib/quantum/compute-engine';

const quantum = await initializeQuantumEngine('mock');
const circuit = quantum.createCircuit(3);
quantum.addGate(circuit.id, { type: 'H', target: 0 });
const result = await quantum.execute(circuit.id);
```

### AI Inference

```typescript
import { quickInfer } from '@/lib/ai/inference-pipeline';

const response = await quickInfer('Your prompt here', 'gpt-4');
```

### GPU Acceleration

```typescript
import { initializeGPUAccelerator } from '@/lib/ai/gpu-acceleration';

const gpu = await initializeGPUAccelerator();
const result = await gpu.matrixMultiply(tensorA, tensorB);
```

### Cloud Deployment

```typescript
import { quickDeploy } from '@/lib/cloud/orchestration';

const deployment = await quickDeploy('production');
console.log('URL:', deployment.url);
```

### Database Optimization

```typescript
import { applyDatabaseOptimizations } from '@/lib/db/scalability';

await applyDatabaseOptimizations(db);
```

## 🎯 Common Patterns

### Full-Stack AI App with XR

```tsx
'use client';
import { HolographicUI } from '@/lib/xr/holographic-ui';
import { ThreeFiberScene, Model3D } from '@/lib/xr/three-fiber-scene';
import { quickInfer } from '@/lib/ai/inference-pipeline';

export default function AIXRApp() {
  const handleAIQuery = async (prompt: string) => {
    return await quickInfer(prompt, 'gpt-4');
  };

  return (
    <HolographicUI enableVR>
      <ThreeFiberScene>
        <Model3D url="/model.glb" />
      </ThreeFiberScene>
    </HolographicUI>
  );
}
```

### Quantum-Enhanced Search

```typescript
import { getQuantumEngine } from '@/lib/quantum/compute-engine';

async function quantumSearch(database: any[], query: string) {
  const quantum = getQuantumEngine();
  await quantum.initialize();
  
  const result = await quantum.groverSearch(database.length, 0);
  return result;
}
```

## 📚 Documentation Links

- **Setup**: [`SETUP_INSTRUCTIONS.md`](SETUP_INSTRUCTIONS.md)
- **Architecture**: [`TIQOLOGY_INFRASTRUCTURE_GUIDE.md`](TIQOLOGY_INFRASTRUCTURE_GUIDE.md)
- **Examples**: [`TIQOLOGY_INTEGRATION_EXAMPLES.md`](TIQOLOGY_INTEGRATION_EXAMPLES.md)
- **Deployment**: [`DEPLOYMENT_COMPLETE.md`](DEPLOYMENT_COMPLETE.md)

## 🔧 Environment Variables

```env
# Required
OPENAI_API_KEY=sk-...
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
POSTGRES_URL=postgresql://...

# Optional
ANTHROPIC_API_KEY=sk-ant-...
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=...
VERCEL_TOKEN=...
CLOUDFLARE_API_TOKEN=...
```

## 🚀 Quick Commands

```bash
# Install all dependencies (optional deps included automatically)
pnpm install

# If native compilation fails, skip optional dependencies
pnpm install --no-optional

# Development
pnpm dev

# Database
pnpm db:migrate
pnpm db:studio

# Build
pnpm build

# Tests
pnpm test
```

## 🎯 Module Locations

| Module | Path |
|--------|------|
| WebGPU | `lib/rendering/webgpu-engine.ts` |
| Three.js | `lib/rendering/three-renderer.ts` |
| Holographic UI | `lib/xr/holographic-ui.tsx` |
| 3D Scenes | `lib/xr/three-fiber-scene.tsx` |
| Quantum | `lib/quantum/compute-engine.ts` |
| AI Inference | `lib/ai/inference-pipeline.ts` |
| GPU Accel | `lib/ai/gpu-acceleration.ts` |
| Cloud | `lib/cloud/orchestration.ts` |
| Database | `lib/db/scalability.ts` |
| Index | `lib/tiqology-index.ts` |

## 💡 Pro Tips

1. **Always initialize before use**
2. **Use `auto` rendering mode for best compatibility**
3. **Enable caching for AI inference**
4. **Mock quantum backend for development**
5. **Apply database optimizations after migrations**
6. **Check compatibility before XR features**

## 📊 Status Check

```typescript
import { checkCompatibility, getCapabilities } from '@/lib/tiqology-index';

const compat = await checkCompatibility();
const caps = await getCapabilities();

console.log('WebGPU:', compat.webgpu ? '✅' : '❌');
console.log('WebXR:', compat.webxr ? '✅' : '❌');
```

---

**Need help?** Check the full documentation or open an issue!
