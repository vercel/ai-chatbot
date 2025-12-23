/**
 * TiQology Platform - Main Export Index
 * Central export point for all modular systems
 */

import { initializeGPUAccelerator } from "./ai/gpu-acceleration";
import { getInferencePipeline } from "./ai/inference-pipeline";
import { getCloudOrchestrator } from "./cloud/orchestration";
import { initializeQuantumEngine } from "./quantum/compute-engine";
// Import functions needed internally
import {
  getBestRenderer,
  initializeThreeRenderer,
} from "./rendering/three-renderer";
import { initializeWebGPU } from "./rendering/webgpu-engine";

export {
  detectBestGPUBackend,
  GPUAccelerator,
  type GPUConfig,
  type GPUKernel,
  type GPUTensor,
  getGPUAccelerator,
  initializeGPUAccelerator,
} from "./ai/gpu-acceleration";
// ========================================
// AI INFERENCE
// ========================================
export {
  getInferencePipeline,
  type InferenceConfig,
  InferencePipeline,
  type InferenceRequest,
  type InferenceResult,
  quickInfer,
  quickStream,
} from "./ai/inference-pipeline";
// ========================================
// CLOUD ORCHESTRATION
// ========================================
export {
  type CloudConfig,
  CloudOrchestrator,
  checkHealth,
  type DeploymentConfig,
  type DeploymentResult,
  deployWithAutoScaling,
  getCloudOrchestrator,
  quickDeploy,
} from "./cloud/orchestration";
// ========================================
// DATABASE SCALABILITY
// ========================================
export {
  applyDatabaseOptimizations,
  DatabaseMonitor,
  generateIndexSQL,
  generatePartitionSQL,
  generateRLSPolicySQL,
  healthCheckQueries,
  indexingStrategy,
  maintenanceQueries,
  optimizationConfig,
  rlsPolicies,
} from "./db/scalability";

// ========================================
// QUANTUM COMPUTING
// ========================================
export {
  calculateGroverIterations,
  estimateQuantumAdvantage,
  getQuantumEngine,
  initializeQuantumEngine,
  type QuantumBackend,
  type QuantumCircuit,
  QuantumComputeEngine,
  type QuantumGate,
  type QuantumJobConfig,
  type QuantumResult,
} from "./quantum/compute-engine";
export {
  getBestRenderer,
  getThreeRenderer,
  initializeThreeRenderer,
  type Scene3D,
  ThreeRenderer,
  type ThreeRendererConfig,
} from "./rendering/three-renderer";
// ========================================
// RENDERING SYSTEMS
// ========================================
export {
  defaultShaders,
  getWebGPUEngine,
  initializeWebGPU,
  type RenderPipeline,
  type WebGPUConfig,
  WebGPUEngine,
} from "./rendering/webgpu-engine";
// ========================================
// XR / HOLOGRAPHIC UI
// ========================================
export {
  HolographicButton,
  type HolographicButtonProps,
  HolographicLoader,
  HolographicNotification,
  HolographicPanel,
  type HolographicPanelProps,
  HolographicUI,
  type HolographicUIProps,
  SpatialAudio,
  type SpatialAudioProps,
  useHandTracking,
} from "./xr/holographic-ui";
export {
  Environment,
  Lighting,
  Model3D,
  type Model3DProps,
  ParticleSystem,
  PostProcessing,
  Text3D,
  ThreeFiberScene,
  type ThreeFiberSceneProps,
  useOrbitControls,
  usePhysics,
} from "./xr/three-fiber-scene";

// ========================================
// UTILITY FUNCTIONS
// ========================================

/**
 * Initialize all TiQology systems
 * Convenience function to bootstrap the entire platform
 */
export async function initializeTiQology(config?: {
  rendering?: "webgpu" | "three" | "auto";
  quantum?: "aws-braket" | "qiskit" | "mock";
  gpu?: "webgpu" | "gpu.js" | "webgl";
  database?: boolean;
}) {
  const results = {
    rendering: null as any,
    quantum: null as any,
    gpu: null as any,
    inference: null as any,
    cloud: null as any,
  };

  // Initialize rendering
  if (config?.rendering === "auto") {
    const best = await getBestRenderer();
    if (best === "webgpu") {
      results.rendering = await initializeWebGPU();
    } else {
      results.rendering = await initializeThreeRenderer();
    }
  } else if (config?.rendering === "webgpu") {
    results.rendering = await initializeWebGPU();
  } else {
    results.rendering = await initializeThreeRenderer();
  }

  // Initialize quantum
  results.quantum = await initializeQuantumEngine(config?.quantum || "mock");

  // Initialize GPU acceleration
  results.gpu = await initializeGPUAccelerator({
    mode: config?.gpu || "gpu.js",
  });

  // Initialize AI inference
  results.inference = getInferencePipeline();

  // Initialize cloud orchestration
  results.cloud = getCloudOrchestrator();

  return results;
}

/**
 * Check system compatibility
 */
export async function checkCompatibility() {
  const compatibility = {
    webgpu: false,
    webxr: false,
    webgl: false,
    quantum: false,
    gpu: false,
  };

  // Check WebGPU
  if (typeof navigator !== "undefined" && "gpu" in navigator) {
    try {
      const adapter = await navigator.gpu!.requestAdapter();
      compatibility.webgpu = !!adapter;
    } catch (e) {
      compatibility.webgpu = false;
    }
  }

  // Check WebXR
  if (typeof navigator !== "undefined" && "xr" in navigator) {
    try {
      const supported = await (navigator as any).xr?.isSessionSupported(
        "immersive-vr"
      );
      compatibility.webxr = supported;
    } catch (e) {
      compatibility.webxr = false;
    }
  }

  // Check WebGL
  if (typeof document !== "undefined") {
    const canvas = document.createElement("canvas");
    compatibility.webgl = !!(
      canvas.getContext("webgl") || canvas.getContext("webgl2")
    );
  }

  compatibility.quantum = true; // Mock always available
  compatibility.gpu = true; // CPU fallback always available

  return compatibility;
}

/**
 * Get system capabilities
 */
export async function getCapabilities() {
  const compatibility = await checkCompatibility();

  return {
    rendering: {
      webgpu: compatibility.webgpu,
      webgl: compatibility.webgl,
      recommended: compatibility.webgpu ? "webgpu" : "three",
    },
    xr: {
      vr: compatibility.webxr,
      ar: compatibility.webxr,
      handTracking: compatibility.webxr,
    },
    quantum: {
      backends: ["aws-braket", "qiskit", "mock"],
      recommended: "mock", // Would be 'aws-braket' in production
    },
    ai: {
      models: ["gpt-4", "gpt-4-turbo", "claude-3-opus"],
      features: ["streaming", "caching", "batching"],
    },
    gpu: {
      acceleration: compatibility.webgpu || compatibility.webgl,
      recommended: compatibility.webgpu ? "webgpu" : "gpu.js",
    },
  };
}

/**
 * TiQology Platform Information
 */
export const TIQOLOGY_INFO = {
  name: "TiQology",
  version: "1.0.0",
  description:
    "Next-generation AI platform with quantum, XR, and GPU capabilities",
  modules: {
    rendering: "High-performance 3D rendering with WebGPU/Three.js",
    xr: "Immersive holographic UI with WebXR",
    quantum: "Quantum computing abstraction layer",
    ai: "Multi-model inference pipeline",
    gpu: "GPU-accelerated compute",
    cloud: "Multi-cloud orchestration",
    database: "Scalable Postgres with RLS",
  },
  technologies: [
    "Next.js",
    "React",
    "TypeScript",
    "WebGPU",
    "Three.js",
    "WebXR",
    "AWS Braket",
    "OpenAI",
    "Supabase",
    "Vercel",
    "Cloudflare",
  ],
};

// Export version
export const VERSION = TIQOLOGY_INFO.version;

// Export module status
export function getModuleStatus() {
  return {
    rendering: "✅ Ready",
    holographicUI: "✅ Ready",
    quantum: "✅ Ready",
    aiInference: "✅ Ready",
    gpuAcceleration: "✅ Ready",
    cloudOrchestration: "✅ Ready",
    databaseScalability: "✅ Ready",
    cicd: "✅ Ready",
  };
}
