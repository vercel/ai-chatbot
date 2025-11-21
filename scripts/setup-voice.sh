#!/bin/bash

# Setup script for voice integration
# This script copies required VAD model files from node_modules to public directory

set -e

echo "🎤 Setting up voice integration..."

# Create public directory if it doesn't exist
mkdir -p public

# Remove any old/corrupted files
rm -f public/*.onnx public/*.wasm public/*.mjs public/vad.worklet.bundle.min.js 2>/dev/null || true

# Copy VAD model files from node_modules
echo "📦 Copying VAD model files from node_modules..."

if [ -f "node_modules/@ricky0123/vad-web/dist/silero_vad_legacy.onnx" ]; then
  cp node_modules/@ricky0123/vad-web/dist/silero_vad_legacy.onnx public/
  echo "  ✅ silero_vad_legacy.onnx ($(du -h public/silero_vad_legacy.onnx | cut -f1))"
else
  echo "  ❌ silero_vad_legacy.onnx not found in node_modules"
  exit 1
fi

if [ -f "node_modules/@ricky0123/vad-web/dist/vad.worklet.bundle.min.js" ]; then
  cp node_modules/@ricky0123/vad-web/dist/vad.worklet.bundle.min.js public/
  echo "  ✅ vad.worklet.bundle.min.js"
else
  echo "  ❌ vad.worklet.bundle.min.js not found"
  exit 1
fi

# Copy ONNX runtime WASM files
echo "📦 Copying ONNX runtime files..."

if [ -f "node_modules/onnxruntime-web/dist/ort-wasm-simd-threaded.wasm" ]; then
  cp node_modules/onnxruntime-web/dist/ort-wasm-simd-threaded.wasm public/
  cp node_modules/onnxruntime-web/dist/ort-wasm-simd-threaded.mjs public/
  echo "  ✅ ort-wasm-simd-threaded files ($(du -h public/ort-wasm-simd-threaded.wasm | cut -f1))"
else
  echo "  ❌ onnxruntime-web not found"
  exit 1
fi

echo ""
echo "✅ Voice integration setup complete!"
echo ""
echo "📝 Next steps:"
echo "  1. Add GROQ_API_KEY to your .env.local file"
echo "  2. Add CARTESIA_API_KEY to your .env.local file"
echo "  3. Restart your dev server: pnpm dev"
echo ""
echo "🎯 Get API keys from:"
echo "  - Groq: https://console.groq.com/keys"
echo "  - Cartesia: https://cartesia.ai/"
echo ""

