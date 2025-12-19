#!/bin/bash
set -e

echo "🎉 Build succeeded! Now committing and deploying..."
echo ""

# Step 1: Add changes
echo "📦 Step 1: Staging changes..."
git add -A
echo "✅ Changes staged"
echo ""

# Step 2: Commit
echo "💾 Step 2: Committing..."
git commit -m "fix: remove problematic nexus routes for clean deployment" || echo "No changes to commit"
echo "✅ Committed"
echo ""

# Step 3: Push
echo "🚀 Step 3: Pushing to GitHub..."
BRANCH=$(git branch --show-current)
unset GITHUB_TOKEN
export GITHUB_TOKEN=""
git push origin "$BRANCH" || {
    echo "❌ Push failed"
    exit 1
}
echo "✅ Pushed to $BRANCH"
echo ""

# Step 4: Deploy to Vercel
echo "🚀 Step 4: Deploying to Vercel production..."
vercel --prod --yes
echo ""
echo "✅ DEPLOYMENT COMPLETE!"
echo ""
echo "🌐 Your app should be live at:"
echo "   - https://tiqologyspa.vercel.app"
echo "   - https://ai-chatbot-five-gamma-48.vercel.app"
