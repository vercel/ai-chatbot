# 🚀 TiQology Vercel Quick Start

## Current Issues Diagnosed

1. **"Loading..." Screen** - Missing database environment variables
2. **"Frontend-Only Dashboard"** - War Room needs backend APIs (this is just a warning, not blocking)
3. **Login Not Working** - Missing AUTH_SECRET and Supabase config
4. **AI Gateway** - Not configured (optional)

## 🎯 Quick Fix (2 Options)

### Option A: Manual Setup in Vercel Dashboard (FASTEST)

1. **Go to:** https://vercel.com/al-wilsons-projects/ai-chatbot/settings/environment-variables

2. **Add these variables (all for "Production"):**

   ```
   # Required - Database
   DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
   DIRECT_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres

   # Required - Supabase
   NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT-REF].supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

   # Required - Auth
   AUTH_SECRET=<run: openssl rand -base64 32>
   NEXTAUTH_SECRET=<same as AUTH_SECRET>
   NEXTAUTH_URL=https://tiqologyspa.vercel.app

   # Required - AI (choose ONE)
   AI_PROVIDER=google
   GOOGLE_GENERATIVE_AI_API_KEY=your_google_ai_key

   # OR for AI Gateway
   AI_PROVIDER=gateway
   AI_GATEWAY_API_KEY=your_ai_gateway_key (or leave empty for OIDC)
   ```

3. **Get Your Keys:**
   - **Supabase:** https://supabase.com/dashboard/project/[your-project]/settings/api
   - **Google AI:** https://aistudio.google.com/app/apikey (FREE tier available!)
   - **AI Gateway:** https://vercel.com/ai-gateway

4. **Redeploy:**
   ```bash
   vercel --prod
   ```

### Option B: Use Setup Script

```bash
# This will walk you through each variable
bash setup-vercel-env.sh
```

## 🔑 Where to Find Your Keys

### Supabase (Database)

1. Go to: https://supabase.com/dashboard
2. Select your project
3. Settings → Database → Connection string
4. Copy "Pooling" connection string for `DATABASE_URL`
5. Settings → API → Copy these:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - Anon/Public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Service Role key → `SUPABASE_SERVICE_ROLE_KEY` (keep secret!)

### Google AI (Free Option!)

1. Go to: https://aistudio.google.com/app/apikey
2. Click "Create API Key"
3. Copy → `GOOGLE_GENERATIVE_AI_API_KEY`

### AI Gateway (Vercel Option)

1. Go to: https://vercel.com/ai-gateway
2. Click "Get Started"
3. For Vercel deployments: Use OIDC (no API key needed!)
4. For non-Vercel: Create API key → `AI_GATEWAY_API_KEY`

### Auth Secret (Generate)

```bash
openssl rand -base64 32
```

Copy the output for both `AUTH_SECRET` and `NEXTAUTH_SECRET`

## ✅ After Setup

1. **Redeploy:**
   ```bash
   vercel --prod
   ```

2. **Test URLs:**
   - https://tiqologyspa.vercel.app
   - https://ai-chatbot-five-gamma-48.vercel.app

3. **Verify:**
   - ✅ Homepage loads (no "Loading..." stuck)
   - ✅ Can navigate to /login
   - ✅ Can create account
   - ✅ Dashboard shows after login
   - ✅ Chat works

## 🐛 Troubleshooting

### Still seeing "Loading..."?

Check browser console (F12) for errors. Common issues:
- Wrong Supabase URL
- Invalid API keys
- Network/CORS issues

### Login fails?

- Verify `AUTH_SECRET` is set
- Check `NEXTAUTH_URL` matches your domain
- Confirm Supabase credentials are correct

### AI Chat not working?

- Verify `AI_PROVIDER` is set
- Check corresponding API key exists
- For Google: Verify API key has Gemini enabled

### "Frontend-Only Dashboard" message?

This is just a warning for the War Room module. Everything else works fine. We can wire backend APIs later.

## 📞 Need Help?

Check Vercel logs:
```bash
vercel logs https://tiqologyspa.vercel.app
```

Or check production deployment:
https://vercel.com/al-wilsons-projects/ai-chatbot

---

**PRIORITY:** Set up database and auth variables first. AI can come later!
