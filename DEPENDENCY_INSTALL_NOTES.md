# Installing TiQology Dependencies

Due to native compilation requirements in some packages, we're installing them as optional dependencies.

## Install Command

```bash
pnpm install
```

The following packages will be installed as optional:
- `three` - 3D rendering library
- `@react-three/fiber` - React renderer for Three.js
- `@react-three/drei` - Useful helpers for React Three Fiber
- `@react-three/xr` - WebXR components
- `@webgpu/types` - TypeScript definitions for WebGPU
- `@aws-sdk/client-braket` - AWS Quantum computing client

## Note on gpu.js

The `gpu.js` package requires native compilation (OpenGL bindings) which may fail in containerized environments. The GPU acceleration module uses WebGPU/WebGL as alternatives, which work in browsers without native dependencies.

## Troubleshooting

If installation still fails:

1. **Skip optional dependencies:**
   ```bash
   pnpm install --no-optional
   ```

2. **Individual package installation:**
   ```bash
   pnpm add three --save-optional
   pnpm add @react-three/fiber --save-optional
   pnpm add @react-three/drei --save-optional
   pnpm add @react-three/xr --save-optional
   pnpm add @webgpu/types --save-optional
   pnpm add @aws-sdk/client-braket --save-optional
   ```

3. **System dependencies (if needed):**
   ```bash
   sudo apt-get update
   sudo apt-get install -y libxi-dev libxext-dev libx11-dev
   ```

## Usage Without Optional Packages

All TiQology modules gracefully handle missing packages:

- **Rendering**: Falls back to CSS 3D transforms
- **GPU Acceleration**: Uses WebGL/WebGPU (browser-based)
- **Quantum**: Mock simulator always available
- **XR**: Browser WebXR API (no package needed for basic features)

The platform is designed to work progressively - features activate when dependencies are available.
