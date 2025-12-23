#!/bin/bash
# ========================================
# DATABASE BUILD FIX - DEPLOYMENT SCRIPT
# ========================================
# This script commits and deploys the database client fix

set -e  # Exit on error

echo "🔧 DATABASE CLIENT BUILD FIX"
echo "=============================="
echo ""

# 1. Remove the temporary file
echo "1️⃣  Cleaning up temporary files..."
rm -f lib/db/queries_new.ts lib/db/queries.ts.backup 2>/dev/null || true
echo "   ✅ Cleanup complete"
echo ""

# 2. Stage the fixed file
echo "2️⃣  Staging fixed database queries file..."
git add lib/db/queries.ts
echo "   ✅ File staged"
echo ""

# 3. Show what changed
echo "3️⃣  Changes summary:"
git diff --cached --stat
echo ""

# 4. Commit the fix
echo "4️⃣  Committing fix..."
git commit -m "fix: lazy database client initialization for Vercel builds

- Changed from immediate postgres client initialization to lazy getDb() pattern
- Prevents POSTGRES_URL from being required at build time
- All db.* calls replaced with getDb().*
- Fixes build error: 'Command pnpm build exited with 1'

This resolves the issue where environment variables weren't available
during the Next.js build phase on Vercel."
echo "   ✅ Committed"
echo ""

# 5. Push to remote
echo "5️⃣  Pushing to remote..."
git push origin fix/deployment-clean-1766159849
echo "   ✅ Pushed"
echo ""

# 6. Deploy to Vercel
echo "6️⃣  Deploying to Vercel production..."
vercel --prod
echo "   ✅ Deployment initiated"
echo ""

echo "=========================================="
echo "✨ DEPLOYMENT COMPLETE!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "  1. Monitor the deployment at: https://vercel.com/al-wilsons-projects/ai-chatbot"
echo "  2. Once deployed, test guest auth at: https://ai-chatbot-five-gamma-48.vercel.app"
echo "  3. Click 'Continue as Guest' and verify no 500 error"
echo ""
