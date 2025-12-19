#!/bin/bash
set -e

echo "🔧 Disabling /nexus route temporarily..."
echo ""

# Rename nexus folder to exclude it from build
if [ -d "app/nexus" ]; then
  mv app/nexus app/nexus.disabled
  echo "✅ Disabled app/nexus"
fi

# Also disable nexus components
if [ -d "components/nexus" ]; then
  mv components/nexus components/nexus.disabled
  echo "✅ Disabled components/nexus"
fi

echo ""
echo "🔨 Building without /nexus..."
pnpm run build

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ BUILD SUCCESSFUL!"
  echo ""
  echo "Now run: vercel --prod"
else
  echo ""
  echo "❌ Build still failed"
fi
