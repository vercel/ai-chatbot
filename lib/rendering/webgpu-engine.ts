/**
 * TiQology High-Performance WebGPU Rendering Engine
 * Provides hardware-accelerated 3D rendering with WebGPU
 */

export interface WebGPUConfig {
  canvas?: HTMLCanvasElement;
  powerPreference?: "low-power" | "high-performance";
  antialias?: boolean;
  samples?: number;
}

export interface RenderPipeline {
  id: string;
  shaders: {
    vertex: string;
    fragment: string;
  };
  buffers: GPUBuffer[];
  bindGroups: GPUBindGroup[];
}

export class WebGPUEngine {
  private adapter: GPUAdapter | null = null;
  private device: GPUDevice | null = null;
  private context: GPUCanvasContext | null = null;
  private config: WebGPUConfig;
  private pipelines: Map<string, GPURenderPipeline> = new Map();
  private isInitialized = false;

  constructor(config: WebGPUConfig = {}) {
    this.config = {
      powerPreference: "high-performance",
      antialias: true,
      samples: 4,
      ...config,
    };
  }

  async initialize(): Promise<boolean> {
    if (this.isInitialized) return true;

    try {
      // Check WebGPU support
      if (!navigator.gpu) {
        console.warn("WebGPU not supported, falling back to WebGL");
        return false;
      }

      // Request adapter
      this.adapter = await navigator.gpu.requestAdapter({
        powerPreference: this.config.powerPreference,
      });

      if (!this.adapter) {
        console.error("Failed to get WebGPU adapter");
        return false;
      }

      // Request device
      this.device = await this.adapter.requestDevice();

      if (!this.device) {
        console.error("Failed to get WebGPU device");
        return false;
      }

      // Setup canvas context if canvas provided
      if (this.config.canvas) {
        this.context = this.config.canvas.getContext("webgpu");
        if (this.context && this.device) {
          const format = navigator.gpu.getPreferredCanvasFormat();
          this.context.configure({
            device: this.device,
            format,
            alphaMode: "premultiplied",
          });
        }
      }

      this.isInitialized = true;
      console.log("WebGPU engine initialized successfully");
      return true;
    } catch (error) {
      console.error("WebGPU initialization failed:", error);
      return false;
    }
  }

  async createRenderPipeline(config: {
    id: string;
    vertexShader: string;
    fragmentShader: string;
    vertexBufferLayout?: GPUVertexBufferLayout[];
  }): Promise<GPURenderPipeline | null> {
    if (!this.device) return null;

    try {
      const vertexModule = this.device.createShaderModule({
        code: config.vertexShader,
      });

      const fragmentModule = this.device.createShaderModule({
        code: config.fragmentShader,
      });

      const pipelineDescriptor: GPURenderPipelineDescriptor = {
        layout: "auto",
        vertex: {
          module: vertexModule,
          entryPoint: "main",
          buffers: config.vertexBufferLayout || [],
        },
        fragment: {
          module: fragmentModule,
          entryPoint: "main",
          targets: [
            {
              format: navigator.gpu!.getPreferredCanvasFormat(),
            },
          ],
        },
        primitive: {
          topology: "triangle-list",
          cullMode: "back",
        },
      };

      const pipeline = this.device.createRenderPipeline(pipelineDescriptor);
      this.pipelines.set(config.id, pipeline);
      return pipeline;
    } catch (error) {
      console.error("Failed to create render pipeline:", error);
      return null;
    }
  }

  createBuffer(
    data: Float32Array | Uint32Array,
    usage: GPUBufferUsageFlags
  ): GPUBuffer | null {
    if (!this.device) return null;

    const buffer = this.device.createBuffer({
      size: data.byteLength,
      usage,
      mappedAtCreation: true,
    });

    const constructor = data.constructor as any;
    new constructor(buffer.getMappedRange()).set(data);
    buffer.unmap();

    return buffer;
  }

  beginRenderPass(): GPUCommandEncoder | null {
    if (!this.device || !this.context) return null;

    const commandEncoder = this.device.createCommandEncoder();
    const textureView = this.context.getCurrentTexture().createView();

    const renderPassDescriptor: GPURenderPassDescriptor = {
      colorAttachments: [
        {
          view: textureView,
          clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
          loadOp: "clear",
          storeOp: "store",
        },
      ],
    };

    return commandEncoder;
  }

  submit(commandEncoder: GPUCommandEncoder): void {
    if (!this.device) return;
    this.device.queue.submit([commandEncoder.finish()]);
  }

  getDevice(): GPUDevice | null {
    return this.device;
  }

  getContext(): GPUCanvasContext | null {
    return this.context;
  }

  getPipeline(id: string): GPURenderPipeline | undefined {
    return this.pipelines.get(id);
  }

  async dispose(): Promise<void> {
    this.pipelines.clear();
    if (this.device) {
      this.device.destroy();
    }
    this.adapter = null;
    this.device = null;
    this.context = null;
    this.isInitialized = false;
  }
}

// Utility: Create default shaders
export const defaultShaders = {
  vertex: `
    @vertex
    fn main(@location(0) position: vec3<f32>) -> @builtin(position) vec4<f32> {
      return vec4<f32>(position, 1.0);
    }
  `,
  fragment: `
    @fragment
    fn main() -> @location(0) vec4<f32> {
      return vec4<f32>(1.0, 0.0, 1.0, 1.0);
    }
  `,
};

// Singleton instance
let engineInstance: WebGPUEngine | null = null;

export function getWebGPUEngine(config?: WebGPUConfig): WebGPUEngine {
  if (!engineInstance) {
    engineInstance = new WebGPUEngine(config);
  }
  return engineInstance;
}

export async function initializeWebGPU(
  config?: WebGPUConfig
): Promise<WebGPUEngine | null> {
  const engine = getWebGPUEngine(config);
  const success = await engine.initialize();
  return success ? engine : null;
}
