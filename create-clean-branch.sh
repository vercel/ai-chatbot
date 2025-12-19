#!/bin/bash
set -e

echo "🌿 Creating Fresh Branch Without Secrets"
echo "========================================"
echo ""

# Step 1: Fetch latest from origin
echo "📡 Step 1: Fetching latest from origin..."
git fetch origin main
echo "✅ Fetched"
echo ""

# Step 2: Stash current changes
echo "💾 Step 2: Stashing current changes..."
git stash push -m "Temporary stash for clean branch creation"
echo "✅ Changes stashed"
echo ""

# Step 3: Create new branch from main
echo "🌱 Step 3: Creating fresh branch from main..."
NEW_BRANCH="fix/deployment-clean-$(date +%s)"
git checkout -b "$NEW_BRANCH" origin/main
echo "✅ New branch: $NEW_BRANCH"
echo ""

# Step 4: Apply stashed changes
echo "📥 Step 4: Applying stashed changes..."
git stash pop
echo "✅ Changes applied"
echo ""

# Step 5: Add all working directory changes
echo "📦 Step 5: Adding current changes..."
git add -A
echo "✅ Files staged"
echo ""

# Step 6: Commit
echo "💾 Step 6: Committing clean changes..."
git commit -m "Add deployment infrastructure and improvements

- Add deployment helper scripts (cleaned of secrets)
- Add session memory system for AI continuity
- Add Vercel environment configuration scripts
- Add documentation for deployment process
- All scripts ready for production deployment" || {
    echo "Nothing to commit"
    echo "Current changes already match main"
    exit 0
}
echo "✅ Committed"
echo ""

# Step 7: Push new branch
echo "🚀 Step 7: Pushing new clean branch..."
unset GITHUB_TOKEN
export GITHUB_TOKEN=""
git push origin "$NEW_BRANCH" || {
    echo ""
    echo "❌ Push failed. Check error above."
    exit 1
}
echo ""
echo "✅ CLEAN BRANCH PUSHED!"
echo ""
echo "📋 Branch: $NEW_BRANCH"
echo ""
echo "🎯 Next Steps:"
echo "1. Vercel will deploy this branch automatically"
echo "2. Test at: https://tiqologyspa.vercel.app"
echo "3. Create PR: gh pr create --base main --head $NEW_BRANCH"
echo ""
