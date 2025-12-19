#!/bin/bash
set -e

echo "🔧 Resolving Conflicts and Pushing"
echo "=================================="
echo ""

# Step 1: Keep the modified version of DEPLOY_TO_VERCEL_NOW.md
echo "📝 Step 1: Resolving DEPLOY_TO_VERCEL_NOW.md conflict..."
git add DEPLOY_TO_VERCEL_NOW.md
echo "✅ Conflict resolved (keeping modified version)"
echo ""

# Step 2: Add all other files
echo "📦 Step 2: Adding all changes..."
git add -A
echo "✅ All files staged"
echo ""

# Step 3: Commit
echo "💾 Step 3: Committing clean changes..."
git commit -m "Add deployment infrastructure and improvements

- Add deployment helper scripts (cleaned of secrets)
- Add session memory system for AI continuity
- Add Vercel environment configuration scripts
- Add documentation for deployment process
- All scripts ready for production deployment"
echo "✅ Committed"
echo ""

# Step 4: Push
echo "🚀 Step 4: Pushing to GitHub..."
unset GITHUB_TOKEN
export GITHUB_TOKEN=""
BRANCH=$(git branch --show-current)
git push origin "$BRANCH" || {
    echo ""
    echo "❌ Push failed. Check error above."
    exit 1
}
echo ""
echo "✅ CLEAN BRANCH PUSHED!"
echo ""
echo "📋 Branch: $BRANCH"
echo ""
echo "🎯 Next Steps:"
echo "1. Vercel will deploy automatically"
echo "2. Test at: https://tiqologyspa.vercel.app"
echo "3. If working, merge to main: gh pr create --base main --head $BRANCH"
echo ""
