# 🚀 TiQology Quick Deploy Guide

**Last Updated:** December 7, 2025  
**Status:** Ready for Production Deployment

---

## ⚡ Quick Start (5 Minutes)

### Step 1: Deploy Backend (ai-chatbot)

```bash
# 1. Set environment variables in Vercel dashboard
# Go to: https://vercel.com/new
# Import: MrAllgoodWilson/ai-chatbot

# 2. Or use Vercel CLI
vercel --prod

# 3. Or use GitHub Bot (create PR, comment):
/vercel deploy production
```

### Step 2: Run Database Migrations

```bash
# Via Supabase bot (comment on PR):
/supabase migrate docs/migrations/001_tiqology_core_schema.sql
/supabase migrate docs/migrations/002_agentos_schema.sql
/supabase migrate docs/migrations/003_devin_operations_telemetry.sql
/supabase migrate docs/migrations/004_human_economy.sql
/supabase migrate docs/migrations/005_economy_telemetry.sql

# Or via psql:
psql "$DATABASE_URL" -f docs/migrations/001_tiqology_core_schema.sql
psql "$DATABASE_URL" -f docs/migrations/002_agentos_schema.sql
psql "$DATABASE_URL" -f docs/migrations/003_devin_operations_telemetry.sql
psql "$DATABASE_URL" -f docs/migrations/004_human_economy.sql
psql "$DATABASE_URL" -f docs/migrations/005_economy_telemetry.sql
```

### Step 3: Deploy Frontend (tiqology-spa)

```bash
# 1. Update NEXT_PUBLIC_AGENTOS_API_URL with backend URL
# 2. Deploy to Vercel (same as Step 1)
vercel --prod
```

### Step 4: Create First User

1. Visit `https://your-tiqology-spa.vercel.app/register`
2. Register with your email
3. In Supabase SQL Editor, promote to admin:

```sql
UPDATE tiq_users 
SET role = 'admin' 
WHERE email = 'your-email@example.com';
```

### Step 5: Verify

```bash
# Test backend
curl https://your-backend-url.vercel.app/api/health

# Test plans
curl https://your-backend-url.vercel.app/api/economy/subscriptions?action=plans

# Test agents
curl https://your-backend-url.vercel.app/api/agentos/registry
```

---

## 🔑 Required Environment Variables

### Backend (ai-chatbot)

```bash
# Core
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DATABASE_URL=postgresql://...
AUTH_SECRET=your-secret
NEXTAUTH_URL=https://your-backend-url.vercel.app

# GitHub
GITHUB_OAUTH_TOKEN=ghp_your_token

# AI
OPENAI_API_KEY=sk-your-key

# Stripe (when ready)
# STRIPE_SECRET_KEY=sk_test_...
# STRIPE_PUBLISHABLE_KEY=pk_test_...
# STRIPE_WEBHOOK_SECRET=whsec_...
```

### Frontend (tiqology-spa)

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_AGENTOS_API_URL=https://your-backend-url.vercel.app
NEXT_PUBLIC_GHOST_API_URL=https://your-backend-url.vercel.app/api/ghost
NEXT_PUBLIC_GHOST_MODE_API_KEY=your-ghost-api-key
```

---

## 📋 Deployment Checklist

### Pre-Deployment
- [x] Codebase clean (zero errors)
- [x] "Hello World" references purged
- [x] Stripe integration tabled
- [x] Documentation complete
- [x] Environment variables documented

### Deployment
- [ ] Deploy ai-chatbot to Vercel
- [ ] Run all 5 database migrations
- [ ] Deploy tiqology-spa to Vercel
- [ ] Create first admin user
- [ ] Verify all API endpoints

### Post-Deployment
- [ ] Test auth flow
- [ ] Test subscription plans display
- [ ] Test affiliate registration
- [ ] Test agent marketplace
- [ ] Monitor production logs

---

## 🎯 What's Available Immediately

### ✅ Working Features

1. **User Authentication**
   - Sign up / Sign in / Sign out
   - Session management
   - Protected routes

2. **Subscription Plans**
   - View all plans (Free, Starter, Pro, Enterprise)
   - Plan comparison
   - (Checkout tabled for Stripe setup)

3. **Affiliate System**
   - Register as affiliate
   - Get affiliate code (CK1/EK2/DK3 format)
   - Track referrals
   - View earnings

4. **Agent Marketplace**
   - Browse 6+ registered agents
   - View agent details
   - (Deployment coming with frontend directive)

5. **AgentOS API**
   - Route agent tasks
   - Ghost Mode evaluations
   - Best Interest Engine
   - Telemetry logging

6. **Admin Dashboard**
   - Real-time metrics
   - User growth tracking
   - Revenue analytics (MRR/ARR)
   - Affiliate leaderboard

### 🔄 Coming Soon (Via Frontend Directive)

- Complete TiQology OS UI
- Dashboard with overview cards
- Pricing page with Stripe checkout
- Subscription management page
- Affiliate dashboard with charts
- Metrics visualization
- Dark/light mode toggle
- Mobile responsive design

---

## 🚨 Troubleshooting

### "Database connection failed"
- Verify `DATABASE_URL` in environment variables
- Check Supabase project is running
- Ensure IP is whitelisted in Supabase

### "API endpoint returns 401"
- Check `AUTH_SECRET` is set
- Verify user is logged in
- Check session cookie is present

### "Stripe checkout not working"
- This is expected! Stripe is tabled for now
- Enable when account setup complete
- Uncomment code in `subscriptionManagement.ts`

### "Migrations fail"
- Run migrations in order (001 → 005)
- Check for existing tables (use IF NOT EXISTS)
- Verify database user has CREATE permissions

---

## 📚 Documentation

- **Complete System Overview:** `/docs/LAUNCH_STATUS.md`
- **AgentOS Guide:** `/docs/AGENTOS_V1_OVERVIEW.md`
- **Human Economy:** `/docs/HUMAN_ECONOMY.md`
- **Database Schema:** `/docs/TIQOLOGY_CORE_DB_SCHEMA.md`
- **Integration Guide:** `/README-TiQology.md`
- **Deployment Directives:** `/ops/directives/pending/`

---

## 🎉 You're Ready to Launch!

**Commander AL, your TiQology system is ready for production!**

Follow the 5 steps above, and you'll have:
- ✅ A live backend with AgentOS + Human Economy
- ✅ A live frontend (tiqology-spa)
- ✅ A complete database with 43 tables
- ✅ 9+ API endpoints operational
- ✅ 6+ AI agents ready to work

**Let's GOOOOO!** 🚀

---

**Need Help?**
- Review `/docs/LAUNCH_STATUS.md` for complete system status
- Check directives in `/ops/directives/pending/`
- All code is documented with inline comments
