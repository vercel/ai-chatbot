#!/bin/bash
set -e

echo "🗑️  Removing /nexus route completely..."
echo ""

# Remove nexus folders completely
if [ -d "app/nexus.disabled" ]; then
  rm -rf app/nexus.disabled
  echo "✅ Removed app/nexus.disabled"
fi

if [ -d "app/nexus" ]; then
  rm -rf app/nexus
  echo "✅ Removed app/nexus"
fi

if [ -d "components/nexus.disabled" ]; then
  rm -rf components/nexus.disabled
  echo "✅ Removed components/nexus.disabled"
fi

if [ -d "components/nexus" ]; then
  rm -rf components/nexus
  echo "✅ Removed components/nexus"
fi

# Remove gamification if it exists
if [ -f "components/gamification.tsx" ]; then
  rm -f components/gamification.tsx
  echo "✅ Removed components/gamification.tsx"
fi

echo ""
echo "🧹 Cleaning build cache..."
rm -rf .next

echo ""
echo "🔨 Building clean..."
pnpm run build

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ BUILD SUCCESSFUL!"
  echo ""
  echo "Ready to deploy! Run: vercel --prod"
else
  echo ""
  echo "❌ Build still failed"
  exit 1
fi
