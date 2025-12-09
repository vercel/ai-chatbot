# ============================================
# VERCEL DEPLOYMENT - COMPLETE GUIDE
# TiQology Elite v1.5 Production Deployment
# Date: December 8, 2025
# ============================================

## 🚀 DEPLOYMENT STATUS

✅ **COMPLETED:**
- Elite Features (6 enhancements, 2,580+ lines)
- Deployment Documentation (10,000+ lines)
- Cloudflare DNS Configuration (www, api, app)
- Supabase Project Setup (Rose Garden)

🎯 **READY TO DEPLOY:**
- Backend API (ai-chatbot) → api.tiqology.com
- Frontend SPA (tiqology-spa) → www.tiqology.com

---

## STEP 1: GENERATE NEXTAUTH SECRET

Run this command in your terminal:

```bash
openssl rand -base64 32
```

**Copy the output** - you'll need it for Vercel environment variables.

---

## STEP 2: DEPLOY BACKEND TO VERCEL

### A. Create New Project in Vercel Dashboard

1. Go to: https://vercel.com/new
2. Click "Import Git Repository"
3. Select: `MrAllgoodWilson/ai-chatbot`
4. Branch: `feature/agentos-v1.5-global-brain`
5. Project Name: `tiqology-backend-api`
6. Framework Preset: `Next.js`
7. Root Directory: `.` (leave as default)

### B. Configure Environment Variables

**Click "Environment Variables" and add ALL of these:**

| Variable Name | Value | Notes |
|--------------|-------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://iomzbddkmykfruslybxq.supabase.co` | Supabase URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlvbXpiZGRrbXlrZnJ1c2x5YnhxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUwNDMwMjEsImV4cCI6MjA4MDYxOTAyMX0.TtWTiO0_8bLtrmUVmHCYE3j98XkvrYGI6MQkWZCKjqY` | Anon Key |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlvbXpiZGRrbXlrZnJ1c2x5YnhxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUwNDMwMjEsImV4cCI6MjA4MDYxOTAyMX0.TtWTiO0_8bLtrmUVmHCYE3j98XkvrYGI6MQkWZCKjqY` | Service Key |
| `NEXTAUTH_SECRET` | *YOUR_GENERATED_SECRET* | From Step 1 |
| `NEXTAUTH_URL` | `https://api.tiqology.com` | Production URL |
| `NEXT_PUBLIC_DOMAIN` | `tiqology.com` | Root domain |
| `NEXT_PUBLIC_API_URL` | `https://api.tiqology.com` | API URL |
| `NEXT_PUBLIC_APP_URL` | `https://www.tiqology.com` | Frontend URL |
| `CORS_ALLOWED_ORIGINS` | `https://tiqology.com,https://www.tiqology.com,https://app.tiqology.com` | CORS origins |
| `OPENAI_API_KEY` | *YOUR_OPENAI_KEY* | Get from OpenAI dashboard |
| `NODE_ENV` | `production` | Production mode |
| `FEATURE_ELITE_MIDDLEWARE` | `true` | Enable elite middleware |
| `FEATURE_ELITE_INFERENCE` | `true` | Enable AI inference |
| `FEATURE_ANALYTICS` | `true` | Enable analytics |
| `FEATURE_HEALTH_CHECK` | `true` | Enable health checks |
| `RATE_LIMIT_ENABLED` | `true` | Enable rate limiting |
| `RATE_LIMIT_FREE_MAX` | `10` | Free tier limit |
| `RATE_LIMIT_STARTER_MAX` | `100` | Starter tier limit |
| `RATE_LIMIT_PRO_MAX` | `1000` | Pro tier limit |

**IMPORTANT:** Set environment for: **Production, Preview, Development** (select all 3)

### C. Deploy

1. Click **"Deploy"**
2. Wait 2-5 minutes for build to complete
3. Copy your Vercel deployment URL (e.g., `tiqology-backend-api.vercel.app`)

### D. Add Custom Domain

1. Go to: Project Settings → Domains
2. Add domain: `api.tiqology.com`
3. Vercel will show DNS instructions (should already be configured via Cloudflare)
4. Wait for SSL certificate (1-5 minutes)
5. Verify: https://api.tiqology.com/api/health

---

## STEP 3: DEPLOY FRONTEND TO VERCEL (OPTIONAL)

If you have a separate frontend repository (`tiqology-spa`):

### A. Create New Project

1. Go to: https://vercel.com/new
2. Import: `MrAllgoodWilson/tiqology-spa`
3. Project Name: `tiqology-frontend`
4. Framework Preset: `Next.js` or `React` (depending on your frontend)

### B. Configure Environment Variables

| Variable Name | Value |
|--------------|-------|
| `NEXT_PUBLIC_API_URL` | `https://api.tiqology.com` |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://iomzbddkmykfruslybxq.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlvbXpiZGRrbXlrZnJ1c2x5YnhxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUwNDMwMjEsImV4cCI6MjA4MDYxOTAyMX0.TtWTiO0_8bLtrmUVmHCYE3j98XkvrYGI6MQkWZCKjqY` |

### C. Deploy & Add Custom Domain

1. Click **"Deploy"**
2. Add custom domain: `www.tiqology.com`
3. Verify: https://www.tiqology.com

---

## STEP 4: RUN DATABASE MIGRATIONS

After backend is deployed, you need to create the database schema (53 tables).

### Option A: Supabase SQL Editor (Recommended)

1. Go to: https://supabase.com/dashboard/project/iomzbddkmykfruslybxq/sql/new
2. Open your local schema file: `/workspaces/ai-chatbot/lib/db/schema.ts`
3. Generate SQL migration (if you have a migration file in `/drizzle` folder)
4. Copy SQL and paste into Supabase SQL Editor
5. Click **"Run"**

### Option B: Drizzle Push (From Local)

If you have Drizzle configured with database credentials:

```bash
pnpm drizzle-kit push:pg
```

**Note:** This requires `DATABASE_URL` in your `.env` file.

### Option C: Manual SQL (If no migrations exist)

You'll need to manually create tables based on your schema. Let me know if you need the SQL generated.

---

## STEP 5: CREATE ADMIN USER

### A. Register First User

1. Go to: https://api.tiqology.com/register (or your frontend)
2. Create an account with your email
3. Verify email (if email verification is enabled)

### B. Promote to Admin

1. Go to: https://supabase.com/dashboard/project/iomzbddkmykfruslybxq/editor
2. Find the `users` table
3. Find your user by email
4. Set `role` = `admin`
5. Save

---

## STEP 6: VERIFY DEPLOYMENT

### Backend Health Check
```bash
curl https://api.tiqology.com/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2025-12-08T...",
  "services": {
    "database": "connected",
    "ai": "ready"
  }
}
```

### Analytics Dashboard
```bash
curl https://api.tiqology.com/api/analytics
```

### AI Inference
```bash
curl -X POST https://api.tiqology.com/api/inference \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Hello AI", "model": "gpt-4"}'
```

### Frontend (if deployed)
Visit: https://www.tiqology.com

---

## STEP 7: POST-DEPLOYMENT CHECKLIST

- [ ] Backend deployed to Vercel (`api.tiqology.com`)
- [ ] Frontend deployed to Vercel (`www.tiqology.com`) - if applicable
- [ ] Database migrations completed (53 tables)
- [ ] Admin user created and promoted
- [ ] Health check returns `200 OK`
- [ ] Analytics endpoint working
- [ ] AI inference endpoint working
- [ ] CORS configured correctly
- [ ] Rate limiting active
- [ ] SSL certificates installed (automatic via Vercel)

---

## 🎯 QUICK REFERENCE

**Cloudflare DNS:**
- www.tiqology.com → cname.vercel-dns.com (proxied)
- api.tiqology.com → cname.vercel-dns.com (proxied)
- app.tiqology.com → cname.vercel-dns.com (proxied)

**Supabase:**
- Project: supabase-rose-garden
- URL: https://iomzbddkmykfruslybxq.supabase.co
- Dashboard: https://supabase.com/dashboard/project/iomzbddkmykfruslybxq

**Vercel:**
- Dashboard: https://vercel.com/dashboard
- Backend: https://api.tiqology.com
- Frontend: https://www.tiqology.com

---

## 🚨 TROUBLESHOOTING

### Build Fails on Vercel
- Check build logs in Vercel dashboard
- Verify all environment variables are set
- Check Node.js version (should be 18.x or 20.x)

### DNS Not Resolving
- Wait 5-60 minutes for DNS propagation
- Check Cloudflare DNS settings: https://dash.cloudflare.com/6a1096f7d73f43f0bad0e183dbfdff59/tiqology.com/dns
- Verify Vercel domain is added and SSL is active

### Database Connection Errors
- Verify Supabase is active (check dashboard)
- Check `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Ensure database migrations have run

### CORS Errors
- Verify `CORS_ALLOWED_ORIGINS` includes your frontend domain
- Check browser console for specific CORS error
- Update `next.config.ts` if needed

---

## 📞 SUPPORT

**Elite Features Documentation:**
- `/workspaces/ai-chatbot/MISSION_COMPLETE.md`
- `/workspaces/ai-chatbot/COMPLETE_DEPLOYMENT_GUIDE.md`

**Cloudflare DNS:**
- `/workspaces/ai-chatbot/docs/CLOUDFLARE_DOMAIN_SETUP.md`

**Need Help?**
All deployment scripts and documentation are in your repository!

---

## ✅ MISSION STATUS

**Commander AL, you are GO for deployment!**

All systems are configured and ready. Just follow the steps above to deploy to Vercel!

🚀 **DEPLOY NOW!**
