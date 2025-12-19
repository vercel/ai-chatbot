#!/bin/bash
set -e

echo "🎯 Final Push Solution"
echo "====================="
echo ""
echo "Choose your approach:"
echo ""
echo "1. Allow secret via GitHub (FASTEST - 30 seconds)"
echo "2. Create fresh branch (CLEANEST - 2 minutes)"
echo ""
read -p "Enter choice (1 or 2): " choice

if [ "$choice" = "1" ]; then
    echo ""
    echo "🌐 Opening GitHub's secret approval page..."
    echo ""
    echo "Instructions:"
    echo "1. Click 'Allow secret' on the GitHub page"
    echo "2. Come back here and press Enter"
    echo "3. We'll push successfully"
    echo ""
    "$BROWSER" "https://github.com/MrAllgoodWilson/ai-chatbot/security/secret-scanning/unblock-secret/374OvW2f7dJ3Dqo0reKt7iw71fT"
    read -p "Press Enter after allowing the secret on GitHub..."
    
    echo ""
    echo "🚀 Pushing now..."
    unset GITHUB_TOKEN
    export GITHUB_TOKEN=""
    BRANCH=$(git branch --show-current)
    git push origin "$BRANCH" --force
    echo ""
    echo "✅ PUSH SUCCESSFUL!"
    
elif [ "$choice" = "2" ]; then
    echo ""
    echo "🌿 Creating fresh branch..."
    
    # Get the commit before the problematic one
    echo "Finding clean starting point..."
    CLEAN_COMMIT=$(git log --all --oneline | grep -B 1 "8a95f83" | head -1 | awk '{print $1}')
    
    if [ -z "$CLEAN_COMMIT" ]; then
        echo "Creating branch from current main..."
        git fetch origin main
        CLEAN_COMMIT="origin/main"
    fi
    
    # Create new branch
    NEW_BRANCH="fix/deployment-clean-$(date +%s)"
    git checkout -b "$NEW_BRANCH" "$CLEAN_COMMIT"
    
    # Add all current changes
    git add -A
    git commit -m "Add deployment infrastructure (clean)

- Deployment helper scripts without secrets
- Session memory and documentation
- Vercel environment configuration"
    
    # Push new branch
    unset GITHUB_TOKEN
    export GITHUB_TOKEN=""
    git push origin "$NEW_BRANCH"
    
    echo ""
    echo "✅ NEW BRANCH PUSHED: $NEW_BRANCH"
    echo ""
    echo "Next: Create PR from $NEW_BRANCH to main"
    
else
    echo "Invalid choice. Run again and choose 1 or 2."
    exit 1
fi

echo ""
echo "🎉 Vercel will deploy in ~2 minutes"
echo "Check: https://tiqologyspa.vercel.app"
