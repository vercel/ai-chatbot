#!/bin/bash
set -e

echo "🧹 Cleaning Next.js cache and rebuilding..."
echo ""

# Remove .next directory
echo "Removing .next cache..."
rm -rf .next

# Remove node_modules/.cache
echo "Removing node_modules cache..."
rm -rf node_modules/.cache

echo "✅ Cache cleared"
echo ""

echo "🔨 Building..."
pnpm run build

echo ""
echo "✅ Build successful!"
