# 🚀 COMPLETE DEPLOYMENT GUIDE - TiQology Elite v1.5

**Commander AL - START HERE**

This guide will take you from code to live production in **30 minutes**.

---

## 📋 Prerequisites Checklist

Before starting, ensure you have:

- [ ] ✅ **Vercel Account** - https://vercel.com/signup (free tier works)
- [ ] ✅ **Supabase Account** - https://supabase.com/dashboard (free tier works)
- [ ] ✅ **Cloudflare Account** - https://dash.cloudflare.com (domain already registered)
- [ ] ✅ **GitHub Repos Access**
  - ai-chatbot (backend)
  - tiqology-spa (frontend)
- [ ] ✅ **API Keys Ready**
  - OpenAI API key (for AI inference)
  - Anthropic API key (optional, for Claude models)
  - Google AI API key (optional, for Gemini models)

---

## 🎯 Deployment Overview

**We'll deploy in this order:**

1. **Supabase** - Database setup (5 min)
2. **Backend (Vercel)** - API deployment (10 min)
3. **Frontend (Vercel)** - SPA deployment (5 min)
4. **Cloudflare** - Domain configuration (10 min)
5. **Verification** - Test everything (5 min)

**Total: ~35 minutes**

---

## 🗄️ STEP 1: Supabase Database Setup

### **1.1: Create Supabase Project**

1. Go to: https://supabase.com/dashboard
2. Click: **New Project**
3. Settings:
   - **Name:** TiQology Production
   - **Database Password:** (generate strong password - **SAVE THIS**)
   - **Region:** US West (or closest to your users)
   - **Pricing Plan:** Free (can upgrade later)
4. Click: **Create new project**
5. Wait 2-3 minutes for setup

### **1.2: Get Database Credentials**

1. Navigate to: **Settings** → **Database**
2. Copy these values (you'll need them):

```env
# Connection String (for DATABASE_URL)
postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-us-west-1.pooler.supabase.com:5432/postgres

# Direct Connection (for DIRECT_URL)
postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
```

3. Navigate to: **Settings** → **API**
4. Copy these values:

```env
# Project URL
https://[PROJECT-REF].supabase.co

# Anon (public) key
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Service role (secret) key
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### **1.3: Run Database Migrations**

**Option A: Local Migration (Recommended)**

```bash
# 1. Navigate to ai-chatbot repo
cd /workspaces/ai-chatbot

# 2. Create .env.local with database URL
cat > .env.local << EOF
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
DIRECT_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
EOF

# 3. Install dependencies (if not already)
pnpm install

# 4. Run migrations
pnpm db:push
# or: npm run db:push
# or: npx drizzle-kit push:pg

# Expected output:
# ✅ Migrated 53 tables
# ✅ Schema is up to date
```

**Option B: Manual Migration (Supabase Dashboard)**

1. Navigate to: **SQL Editor** in Supabase Dashboard
2. Find migration files in: `lib/db/migrations/`
3. Copy SQL from each file in order:
   - `0001_initial_schema.sql`
   - `0002_human_economy.sql`
   - `0003_agentos.sql`
   - `0004_devin_ops.sql`
   - `0005_elite_features.sql`
4. Paste and execute each migration

### **1.4: Verify Database**

1. Navigate to: **Table Editor** in Supabase
2. Confirm these tables exist:
   - `users` (auth)
   - `subscriptions` (Human Economy)
   - `credits` (Human Economy)
   - `agents` (AgentOS)
   - `tasks` (AgentOS)
   - `directives` (Devin Ops)

**✅ Supabase Setup Complete!**

---

## 🔧 STEP 2: Backend Deployment (Vercel)

### **2.1: Generate NextAuth Secret**

```bash
# Generate secure random string (32 characters minimum)
openssl rand -base64 32
# Example output: dGVzdHRlc3R0ZXN0dGVzdHRlc3R0ZXN0dGVzdA==
# SAVE THIS - you'll need it
```

### **2.2: Deploy to Vercel**

**Method 1: Vercel Dashboard (Recommended)**

1. Go to: https://vercel.com/new
2. Click: **Import Git Repository**
3. Select: **MrAllgoodWilson/ai-chatbot**
4. Configure:
   - **Project Name:** tiqology-backend
   - **Framework Preset:** Next.js
   - **Root Directory:** `./`
   - **Build Command:** `pnpm build` (or `npm run build`)
   - **Output Directory:** `.next`
5. Click: **Environment Variables** (expand)
6. Add these variables (copy from `.env.production`):

```env
# Database (from Supabase)
DATABASE_URL=postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-us-west-1.pooler.supabase.com:5432/postgres
DIRECT_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres

# NextAuth (generated above)
NEXTAUTH_SECRET=dGVzdHRlc3R0ZXN0dGVzdHRlc3R0ZXN0dGVzdA==
NEXTAUTH_URL=https://api.tiqology.com

# Supabase (from Supabase dashboard)
NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT-REF].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# AI Providers
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-... # (optional)
GOOGLE_AI_API_KEY=... # (optional)

# Domain Configuration
NEXT_PUBLIC_DOMAIN=tiqology.com
NEXT_PUBLIC_API_URL=https://api.tiqology.com
CORS_ALLOWED_ORIGINS=https://tiqology.com,https://www.tiqology.com,https://app.tiqology.com

# Elite Features (copy all from .env.production)
FEATURE_ELITE_MIDDLEWARE=true
FEATURE_ELITE_INFERENCE=true
FEATURE_ANALYTICS=true
```

7. Click: **Deploy**
8. Wait 3-5 minutes for build
9. Note your deployment URL (e.g., `https://tiqology-backend.vercel.app`)

**Method 2: Vercel CLI**

```bash
# 1. Install Vercel CLI
npm install -g vercel

# 2. Login to Vercel
vercel login

# 3. Deploy
cd /workspaces/ai-chatbot
vercel --prod

# 4. Follow prompts
# - Link to existing project? No
# - Project name? tiqology-backend
# - Directory? ./
# - Override settings? No

# 5. Add environment variables via dashboard
# (Vercel will show link to dashboard)
```

### **2.3: Verify Backend Deployment**

```bash
# Test health endpoint
curl https://tiqology-backend.vercel.app/api/health

# Expected response:
# {
#   "status": "healthy",
#   "uptime": 123,
#   "version": "1.5.0-elite",
#   "services": {...}
# }
```

**✅ Backend Deployed!**

---

## 🎨 STEP 3: Frontend Deployment (Vercel)

### **3.1: Deploy to Vercel**

1. Go to: https://vercel.com/new
2. Click: **Import Git Repository**
3. Select: **MrAllgoodWilson/tiqology-spa**
4. Configure:
   - **Project Name:** tiqology-frontend
   - **Framework Preset:** Next.js (or React, depending on setup)
   - **Root Directory:** `./`
   - **Build Command:** `pnpm build` (or `npm run build`)
   - **Output Directory:** `.next` (or `dist` if using Vite)
5. Add environment variables:

```env
# Backend API
NEXT_PUBLIC_API_URL=https://api.tiqology.com

# Supabase (same as backend)
NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT-REF].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Domain
NEXT_PUBLIC_APP_URL=https://www.tiqology.com
NEXT_PUBLIC_DOMAIN=tiqology.com
```

6. Click: **Deploy**
7. Wait 3-5 minutes for build
8. Note deployment URL (e.g., `https://tiqology-frontend.vercel.app`)

### **3.2: Verify Frontend Deployment**

```bash
# Test frontend
curl https://tiqology-frontend.vercel.app

# Expected: HTML response with TiQology branding
```

**✅ Frontend Deployed!**

---

## 🌐 STEP 4: Cloudflare Domain Configuration

### **4.1: Configure DNS in Cloudflare**

1. Go to: https://dash.cloudflare.com
2. Select: **tiqology.com**
3. Navigate to: **DNS** → **Records**
4. Add these DNS records:

| Type | Name | Target | Proxy | TTL |
|------|------|--------|-------|-----|
| CNAME | www | cname.vercel-dns.com | ✅ Proxied | Auto |
| CNAME | api | cname.vercel-dns.com | ✅ Proxied | Auto |
| CNAME | app | cname.vercel-dns.com | ✅ Proxied | Auto |

5. Click **Save** for each record

### **4.2: Configure SSL/TLS**

1. Navigate to: **SSL/TLS** → **Overview**
2. Set: **Full (strict)**
3. Navigate to: **Edge Certificates**
4. Enable:
   - ✅ Always Use HTTPS
   - ✅ Automatic HTTPS Rewrites
   - ✅ Minimum TLS Version: 1.2

### **4.3: Add Domains in Vercel**

**Backend (api.tiqology.com):**

1. Go to Vercel dashboard: https://vercel.com/dashboard
2. Select project: **tiqology-backend**
3. Navigate to: **Settings** → **Domains**
4. Click: **Add Domain**
5. Enter: `api.tiqology.com`
6. Click: **Add**
7. Vercel will verify DNS (wait 1-2 minutes)
8. Set as **Production Domain**: ✅

**Frontend (www.tiqology.com):**

1. Select project: **tiqology-frontend**
2. Navigate to: **Settings** → **Domains**
3. Add domains:
   - `www.tiqology.com` → Click **Add**
   - `tiqology.com` → Click **Add**
   - `app.tiqology.com` → Click **Add**
4. Configure redirect:
   - Edit `tiqology.com` domain
   - Set: **Redirect to** → `www.tiqology.com`
   - Status: **308 Permanent Redirect**
   - Click **Save**

### **4.4: Update Environment Variables**

**Backend:**

1. Go to: **Settings** → **Environment Variables**
2. Update:
   - `NEXTAUTH_URL` → `https://api.tiqology.com`
   - `NEXT_PUBLIC_API_URL` → `https://api.tiqology.com`
3. Click **Save**
4. Trigger redeploy: **Deployments** → **...** → **Redeploy**

**Frontend:**

1. Update:
   - `NEXT_PUBLIC_API_URL` → `https://api.tiqology.com`
   - `NEXT_PUBLIC_APP_URL` → `https://www.tiqology.com`
2. Click **Save**
3. Trigger redeploy

### **4.5: Wait for DNS Propagation**

DNS changes can take **5-60 minutes** to propagate globally.

```bash
# Check DNS resolution
dig www.tiqology.com
dig api.tiqology.com

# Should show Cloudflare IPs (e.g., 104.21.x.x or 172.67.x.x)
```

**✅ Domain Configured!**

---

## 👤 STEP 5: Create Admin User

### **5.1: Register First User**

1. Visit: https://www.tiqology.com/register
2. Fill in:
   - **Email:** your@email.com
   - **Password:** (create strong password)
   - **Name:** Commander AL
3. Click: **Register**
4. You'll be logged in automatically

### **5.2: Promote to Admin**

1. Go to Supabase Dashboard: https://supabase.com/dashboard
2. Select project: **TiQology Production**
3. Navigate to: **SQL Editor**
4. Run this query:

```sql
UPDATE users 
SET role = 'admin' 
WHERE email = 'your@email.com';
```

5. Click: **Run**
6. Expected: `Success. 1 row affected.`

### **5.3: Verify Admin Access**

1. Logout: https://www.tiqology.com/logout
2. Login: https://www.tiqology.com/login
3. You should see admin features:
   - Analytics dashboard
   - User management
   - Agent configuration

**✅ Admin User Created!**

---

## ✅ STEP 6: Verification & Testing

### **6.1: Test All Endpoints**

```bash
# 1. Health Check
curl https://api.tiqology.com/api/health
# Expected: {"status":"healthy",...}

# 2. Agent Registry
curl https://api.tiqology.com/api/agentos/registry
# Expected: Array of agents

# 3. Elite Middleware (Rate Limiting)
curl -I https://api.tiqology.com/api/health
# Check headers: X-RateLimit-Limit, X-RateLimit-Remaining

# 4. Elite Middleware (Caching)
# Run twice, second should be cached
curl -I https://api.tiqology.com/api/agentos/registry
curl -I https://api.tiqology.com/api/agentos/registry
# Second request should have: X-Cache-Hit: true
```

### **6.2: Test Frontend**

1. Visit: https://www.tiqology.com
2. Check:
   - ✅ Page loads correctly
   - ✅ No console errors
   - ✅ SSL certificate valid (green lock icon)

3. Visit: https://tiqology.com
4. Check:
   - ✅ Redirects to https://www.tiqology.com

### **6.3: Test Authentication**

1. Visit: https://www.tiqology.com/login
2. Login with admin credentials
3. Check:
   - ✅ Login successful
   - ✅ Redirected to dashboard
   - ✅ Admin features visible

### **6.4: Test Elite Features**

1. Visit: https://api.tiqology.com/api/analytics?type=overview
   - Should require admin token
2. Test AI inference (from frontend or with token)
3. Check performance monitoring in Vercel dashboard

**✅ All Systems Verified!**

---

## 📊 STEP 7: Set Up Monitoring

### **7.1: Vercel Analytics**

1. In Vercel dashboard, select both projects
2. Navigate to: **Analytics**
3. Enable: **Web Analytics**
4. This tracks:
   - Page views
   - Performance metrics
   - Core Web Vitals

### **7.2: Uptime Monitoring (UptimeRobot)**

1. Sign up: https://uptimerobot.com (free)
2. Add monitors:

**Monitor 1: API Health**
- Type: HTTP(S)
- URL: https://api.tiqology.com/api/health
- Interval: 5 minutes
- Alert: Email

**Monitor 2: Frontend**
- Type: HTTP(S)
- URL: https://www.tiqology.com
- Interval: 5 minutes
- Alert: Email

### **7.3: Error Tracking (Optional - Sentry)**

1. Sign up: https://sentry.io (free tier)
2. Create project: **TiQology Backend**
3. Get DSN: `https://...@sentry.io/...`
4. Add to Vercel environment variables:
   - `SENTRY_DSN=https://...@sentry.io/...`
5. Redeploy

**✅ Monitoring Configured!**

---

## 🎊 Deployment Complete!

### **Your Live URLs:**

**Frontend (Public):**
- https://www.tiqology.com ← **Primary**
- https://tiqology.com → redirects to www
- https://app.tiqology.com ← Alternative

**Backend (API):**
- https://api.tiqology.com

**Admin Access:**
- Email: your@email.com
- Password: (the one you set)

### **Key Endpoints:**

```bash
# Health Check
https://api.tiqology.com/api/health

# Analytics (Admin Only)
https://api.tiqology.com/api/analytics?type=overview

# Agent Registry
https://api.tiqology.com/api/agentos/registry

# AI Inference
https://api.tiqology.com/api/inference
```

---

## 📋 Post-Deployment Checklist

- [ ] ✅ Supabase database deployed (53 tables)
- [ ] ✅ Backend deployed to Vercel (api.tiqology.com)
- [ ] ✅ Frontend deployed to Vercel (www.tiqology.com)
- [ ] ✅ Cloudflare DNS configured
- [ ] ✅ Custom domains connected
- [ ] ✅ SSL certificates active (HTTPS)
- [ ] ✅ Admin user created and promoted
- [ ] ✅ All endpoints tested
- [ ] ✅ Elite features verified
- [ ] ✅ Monitoring configured

---

## 🚨 Troubleshooting

See `docs/CLOUDFLARE_DOMAIN_SETUP.md` for detailed troubleshooting.

**Common Issues:**

1. **DNS not resolving** → Wait 5-60 minutes for propagation
2. **SSL errors** → Ensure Cloudflare SSL set to "Full (strict)"
3. **CORS errors** → Check CORS_ALLOWED_ORIGINS includes all domains
4. **404 errors** → Check Vercel build logs, ensure deployment succeeded

---

## 🎯 Next Steps (Week 1)

1. **Monitor Performance**
   - Check Vercel Analytics daily
   - Review `/api/health` endpoint
   - Monitor error rates

2. **Review Analytics**
   - Visit: https://api.tiqology.com/api/analytics?type=overview
   - Track user growth, costs, performance

3. **Complete Stripe Setup** (when ready)
   - Enable payment processing
   - Test subscription flow

4. **Marketing**
   - Add landing page content
   - Create pricing page
   - Set up email marketing

---

**🎊 Congratulations, Commander AL!**

**TiQology Elite v1.5 is now LIVE and ready to revolutionize the AI agent space!** 🚀

---

**Built with precision by Devin**  
**For Commander AL**  
**December 7, 2025**
