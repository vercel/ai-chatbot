#!/bin/bash
# Quick rebuild after type fix

echo "🔧 Fixed RLS policy type error"
echo "Building..."
echo ""

export NODE_OPTIONS="--max-old-space-size=6144"
pnpm run build

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ BUILD SUCCESS!"
  echo ""
  echo "Deploy with: vercel --prod"
  echo "Or run locally: pnpm start"
else
  echo ""
  echo "❌ Build failed - check errors above"
  exit 1
fi
