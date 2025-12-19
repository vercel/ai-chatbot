#!/bin/bash
set -e

echo "🚀 Deploying Clean Branch to Vercel"
echo "===================================="
echo ""

# Step 1: Get current branch
BRANCH=$(git branch --show-current)
echo "📋 Current branch: $BRANCH"
echo ""

# Step 2: Deploy to Vercel
echo "🚀 Deploying to Vercel production..."
unset GITHUB_TOKEN
export GITHUB_TOKEN=""
vercel --prod --yes || {
    echo ""
    echo "❌ Deployment failed. Trying alternative method..."
    echo ""
    # Alternative: Deploy specific branch
    vercel deploy --prod --yes || {
        echo ""
        echo "⚠️  Automatic deployment failed."
        echo ""
        echo "Please deploy manually via Vercel dashboard:"
        echo "1. Go to: https://vercel.com/al-wilsons-projects/ai-chatbot"
        echo "2. Click 'Deployments' tab"
        echo "3. Find branch: $BRANCH"
        echo "4. Click '...' menu → 'Promote to Production'"
        exit 1
    }
}
echo ""
echo "✅ DEPLOYMENT COMPLETE!"
echo ""
echo "🌐 Your URLs should be live in ~60 seconds:"
echo "   - https://tiqologyspa.vercel.app"
echo "   - https://ai-chatbot-five-gamma-48.vercel.app"
echo ""
echo "🧪 Test with:"
echo "   curl https://tiqologyspa.vercel.app"
echo ""
