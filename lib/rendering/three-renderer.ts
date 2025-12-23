/**
 * TiQology Three.js Renderer
 * Fallback and primary 3D rendering engine using Three.js
 */

export interface ThreeRendererConfig {
  canvas?: HTMLCanvasElement;
  antialias?: boolean;
  alpha?: boolean;
  powerPreference?: "default" | "high-performance" | "low-power";
  width?: number;
  height?: number;
}

export interface Scene3D {
  id: string;
  objects: any[];
  camera: any;
  lights: any[];
}

export class ThreeRenderer {
  private renderer: any = null;
  private scenes: Map<string, Scene3D> = new Map();
  private config: ThreeRendererConfig;
  private isInitialized = false;
  private animationId: number | null = null;

  constructor(config: ThreeRendererConfig = {}) {
    this.config = {
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
      ...config,
    };
  }

  async initialize(): Promise<boolean> {
    if (this.isInitialized) return true;

    try {
      // Dynamic import of Three.js (only when needed)
      const THREE = await this.loadThree();
      if (!THREE) return false;

      // Create renderer
      this.renderer = new THREE.WebGLRenderer({
        canvas: this.config.canvas,
        antialias: this.config.antialias,
        alpha: this.config.alpha,
        powerPreference: this.config.powerPreference,
      });

      // Set size
      if (this.config.width && this.config.height) {
        this.renderer.setSize(this.config.width, this.config.height);
      }

      // Enable shadow mapping
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

      // Set pixel ratio
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

      this.isInitialized = true;
      console.log("Three.js renderer initialized successfully");
      return true;
    } catch (error) {
      console.error("Three.js initialization failed:", error);
      return false;
    }
  }

  private async loadThree(): Promise<any> {
    try {
      // Try to load Three.js if available
      // This will work when the package is installed
      const THREE = await import("three");
      return THREE;
    } catch (error) {
      console.error("Three.js not available:", error);
      return null;
    }
  }

  async createScene(id: string): Promise<Scene3D | null> {
    try {
      const THREE = await this.loadThree();
      if (!THREE) return null;

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(
        75,
        (this.config.width || 800) / (this.config.height || 600),
        0.1,
        1000
      );

      camera.position.z = 5;

      // Add ambient light
      const ambientLight = new THREE.AmbientLight(0xff_ff_ff, 0.5);
      scene.add(ambientLight);

      // Add directional light
      const directionalLight = new THREE.DirectionalLight(0xff_ff_ff, 0.8);
      directionalLight.position.set(5, 10, 7.5);
      directionalLight.castShadow = true;
      scene.add(directionalLight);

      const scene3D: Scene3D = {
        id,
        objects: [scene],
        camera,
        lights: [ambientLight, directionalLight],
      };

      this.scenes.set(id, scene3D);
      return scene3D;
    } catch (error) {
      console.error("Failed to create scene:", error);
      return null;
    }
  }

  async addObject(sceneId: string, object: any): Promise<boolean> {
    const scene = this.scenes.get(sceneId);
    if (!scene || scene.objects.length === 0) return false;

    scene.objects[0].add(object);
    return true;
  }

  async createMesh(geometry: any, material: any): Promise<any> {
    try {
      const THREE = await this.loadThree();
      if (!THREE) return null;

      return new THREE.Mesh(geometry, material);
    } catch (error) {
      console.error("Failed to create mesh:", error);
      return null;
    }
  }

  render(sceneId: string): void {
    const scene = this.scenes.get(sceneId);
    if (!scene || !this.renderer || scene.objects.length === 0) return;

    this.renderer.render(scene.objects[0], scene.camera);
  }

  startAnimationLoop(sceneId: string, onAnimate?: () => void): void {
    const animate = () => {
      this.animationId = requestAnimationFrame(animate);

      if (onAnimate) {
        onAnimate();
      }

      this.render(sceneId);
    };

    animate();
  }

  stopAnimationLoop(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  setSize(width: number, height: number): void {
    if (this.renderer) {
      this.renderer.setSize(width, height);

      // Update all cameras
      this.scenes.forEach((scene) => {
        if (scene.camera && scene.camera.aspect !== undefined) {
          scene.camera.aspect = width / height;
          scene.camera.updateProjectionMatrix();
        }
      });
    }
  }

  getRenderer(): any {
    return this.renderer;
  }

  getScene(id: string): Scene3D | undefined {
    return this.scenes.get(id);
  }

  dispose(): void {
    this.stopAnimationLoop();

    // Dispose scenes
    this.scenes.forEach((scene) => {
      scene.objects.forEach((obj) => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          if (Array.isArray(obj.material)) {
            obj.material.forEach((mat: any) => mat.dispose());
          } else {
            obj.material.dispose();
          }
        }
      });
    });

    this.scenes.clear();

    // Dispose renderer
    if (this.renderer) {
      this.renderer.dispose();
      this.renderer = null;
    }

    this.isInitialized = false;
  }
}

// Singleton instance
let rendererInstance: ThreeRenderer | null = null;

export function getThreeRenderer(config?: ThreeRendererConfig): ThreeRenderer {
  if (!rendererInstance) {
    rendererInstance = new ThreeRenderer(config);
  }
  return rendererInstance;
}

export async function initializeThreeRenderer(
  config?: ThreeRendererConfig
): Promise<ThreeRenderer | null> {
  const renderer = getThreeRenderer(config);
  const success = await renderer.initialize();
  return success ? renderer : null;
}

// Helper to choose best renderer
export async function getBestRenderer(
  config?: any
): Promise<"webgpu" | "three" | null> {
  // Try WebGPU first
  if (navigator.gpu) {
    try {
      const adapter = await navigator.gpu.requestAdapter();
      if (adapter) return "webgpu";
    } catch (e) {
      console.log("WebGPU not available, using Three.js");
    }
  }

  // Fallback to Three.js
  return "three";
}
