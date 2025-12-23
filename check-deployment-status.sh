#!/bin/bash

echo "📊 Deployment Status Check"
echo "=========================="
echo ""

echo "Current branch:"
git branch --show-current
echo ""

echo "Recent commits:"
git log --oneline -3
echo ""

echo "🔍 To fix the blank pages, we need to:"
echo ""
echo "1. Check Vercel environment variables are set:"
echo "   - Go to: https://vercel.com/al-wilsons-projects/ai-chatbot/settings/environment-variables"
echo "   - Ensure these are set for Production:"
echo "     • GOOGLE_GENERATIVE_AI_API_KEY"
echo "     • AUTH_SECRET"
echo "     • POSTGRES_URL (from Vercel Postgres integration)"
echo ""
echo "2. Check Vercel deployment logs:"
echo "   https://vercel.com/al-wilsons-projects/ai-chatbot/deployments"
echo ""
echo "3. The tiqologyspa.vercel.app domain might be pointing to a different project."
echo "   Your working deployment is: https://ai-chatbot-five-gamma-48.vercel.app"
echo ""
