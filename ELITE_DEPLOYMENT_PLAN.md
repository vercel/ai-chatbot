# 🚀 TiQology Elite Deployment Plan
**Goal:** Production-ready deployment with zero compromises

---

## Phase 1: Database Foundation ✨

### Step 1.1: Verify Supabase Setup
1. Go to: https://supabase.com/dashboard/project/iomzbddkmykfruslybxq
2. Verify project is **active** (not paused)
3. Note these values from Settings → Database:
   - **Connection String (Direct)**: Used for migrations
   - **Connection Pooler (Transaction mode)**: Used for runtime

### Step 1.2: Get Correct Connection Strings

**For Migrations (Build Time):**
```
postgresql://postgres:GZGLrGQV4bGRdrTZ@db.iomzbddkmykfruslybxq.supabase.co:5432/postgres
```

**For Runtime (Application):**
```
postgresql://postgres.iomzbddkmykfruslybxq:GZGLrGQV4bGRdrTZ@aws-0-us-west-1.pooler.supabase.com:6543/postgres
```

### Step 1.3: Initialize Database Schema

**Option A: Use Supabase SQL Editor (RECOMMENDED)**
1. Go to SQL Editor in Supabase Dashboard
2. Run the complete schema from `database-setup-complete.sql`
3. Verify tables exist with: `SELECT tablename FROM pg_tables WHERE schemaname = 'public';`

**Option B: Local Migration (If you have psql)**
```bash
# Set environment variable
export POSTGRES_URL="postgresql://postgres:GZGLrGQV4bGRdrTZ@db.iomzbddkmykfruslybxq.supabase.co:5432/postgres"

# Run migrations
pnpm db:migrate
```

### Step 1.4: Verify Database
Run this in Supabase SQL Editor:
```sql
-- Should return 7+ tables
SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;

-- Verify User table structure
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'User';
```

**Expected tables:**
- User
- Chat
- Message_v2
- Vote_v2
- Document
- Suggestion
- Stream

---

## Phase 2: Vercel Configuration 🎛️

### Step 2.1: Environment Variables

Set these in **Vercel → Settings → Environment Variables**

#### Required for ALL Environments:

**Database (Production & Preview):**
```
POSTGRES_URL=postgresql://postgres.iomzbddkmykfruslybxq:GZGLrGQV4bGRdrTZ@aws-0-us-west-1.pooler.supabase.com:6543/postgres

DATABASE_URL=postgresql://postgres.iomzbddkmykfruslybxq:GZGLrGQV4bGRdrTZ@aws-0-us-west-1.pooler.supabase.com:6543/postgres

DIRECT_URL=postgresql://postgres:GZGLrGQV4bGRdrTZ@db.iomzbddkmykfruslybxq.supabase.co:5432/postgres
```

**Auth (Production only):**
```
NEXTAUTH_URL=https://ai-chatbot-five-gamma-48.vercel.app
NEXTAUTH_SECRET=[Generate with: openssl rand -base64 32]
AUTH_SECRET=[Same as NEXTAUTH_SECRET]
```

**Supabase (All Environments):**
```
NEXT_PUBLIC_SUPABASE_URL=https://iomzbddkmykfruslybxq.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[Get from Supabase Settings → API]
SUPABASE_SERVICE_ROLE_KEY=[Get from Supabase Settings → API]
```

**AI Providers (Keep existing):**
- GOOGLE_GENERATIVE_AI_API_KEY
- OPENAI_API_KEY
- ANTHROPIC_API_KEY

### Step 2.2: Build Settings

**Settings → Build & Development Settings**

| Setting | Value |
|---------|-------|
| Framework Preset | Next.js (auto-detected) |
| Build Command | `pnpm build` (NO migrations during build) |
| Output Directory | `.next` (default) |
| Install Command | `pnpm install` (default) |
| Root Directory | (empty) |
| Node.js Version | 20.x |

**Why no migrations in build?**
- Vercel's build environment has IPv6 connectivity issues
- Database is already set up in Phase 1
- Cleaner separation of concerns

### Step 2.3: Build Optimizations

**Environment Variables (All Environments):**
```
NODE_ENV=production
NODE_OPTIONS=--max-old-space-size=4096
```

---

## Phase 3: Code Quality Check 🔍

### Step 3.1: Review Critical Files

Verify these files are production-ready:

**Auth Configuration:**
- `app/(auth)/auth.ts` - Guest user creation
- `app/(auth)/auth.config.ts` - Auth routes
- `lib/db/queries.ts` - Database queries

**Database:**
- `lib/db/schema.ts` - Schema matches migrations
- `drizzle.config.ts` - Connection config

**Environment:**
- `.env.example` - Template is correct
- No `.env.local` or `.env` files committed

### Step 3.2: Verify Dependencies

```bash
# Check for vulnerabilities
pnpm audit

# Update critical dependencies if needed
pnpm update @ai-sdk/google @ai-sdk/openai next next-auth
```

---

## Phase 4: Deployment Sequence 📦

### Step 4.1: Clean Git State

```bash
# Check current branch
git branch

# Ensure clean working directory
git status

# If needed, commit any pending changes
git add .
git commit -m "chore: prepare for elite deployment"
git push origin fix/deployment-clean-1766159849
```

### Step 4.2: Deploy to Vercel

1. Go to **Vercel Dashboard → Deployments**
2. Click **"Create Deployment"** or trigger via Git push
3. Monitor build logs for:
   - ✅ Dependencies installed
   - ✅ Next.js build completes
   - ✅ No TypeScript errors
   - ✅ Deployment successful

### Step 4.3: First Deployment Test

**Immediately after deployment:**

1. **Test Guest Access:**
   - Open: https://ai-chatbot-five-gamma-48.vercel.app
   - Should auto-create guest user
   - Try sending a message

2. **Test Authentication:**
   - Go to `/login`
   - Register new account
   - Login with credentials

3. **Check Logs:**
   - Vercel → Logs → Functions
   - Look for any errors in real-time

---

## Phase 5: Post-Deployment Verification ✅

### Step 5.1: Database Verification

In Supabase SQL Editor:
```sql
-- Check user creation
SELECT id, email, created_at FROM "User" ORDER BY created_at DESC LIMIT 5;

-- Check chat creation
SELECT id, title, "userId", "createdAt" FROM "Chat" ORDER BY "createdAt" DESC LIMIT 5;

-- Check messages
SELECT role, "chatId", "createdAt" FROM "Message_v2" ORDER BY "createdAt" DESC LIMIT 5;
```

### Step 5.2: Performance Check

1. **Lighthouse Score:**
   - Run in Chrome DevTools
   - Target: 90+ performance

2. **Function Logs:**
   - Check cold start times
   - Verify database connection pooling

3. **Error Tracking:**
   - Check Vercel logs for any runtime errors
   - Monitor for 24 hours

### Step 5.3: Feature Verification

Test each feature:
- ✅ Guest user auto-creation
- ✅ User registration
- ✅ User login/logout
- ✅ Chat creation
- ✅ Message sending
- ✅ AI responses
- ✅ Chat history
- ✅ Document artifacts
- ✅ Code execution (if enabled)

---

## Phase 6: Domain & SSL (Optional) 🌐

### If using custom domain:

1. **Add Domain in Vercel:**
   - Settings → Domains
   - Add: `tiqology.com` and `www.tiqology.com`

2. **Update DNS:**
   ```
   Type: CNAME
   Name: @
   Value: cname.vercel-dns.com
   ```

3. **Update Environment Variables:**
   ```
   NEXTAUTH_URL=https://tiqology.com
   ```

4. **Redeploy** after domain is verified

---

## Phase 7: Monitoring & Maintenance 📊

### Set Up Monitoring:

1. **Vercel Analytics:**
   - Already integrated via `@vercel/analytics`
   - Monitor in Vercel Dashboard

2. **Supabase Dashboard:**
   - Monitor database connections
   - Check query performance
   - Set up alerts for high usage

3. **Error Tracking:**
   - Monitor Vercel function logs daily
   - Set up log drains if needed

### Maintenance Schedule:

**Daily (First Week):**
- Check error logs
- Monitor performance
- Verify user activity

**Weekly:**
- Review analytics
- Check dependency updates
- Database performance review

**Monthly:**
- Security audit
- Dependency updates
- Performance optimization

---

## Emergency Rollback Plan 🔄

If deployment fails:

1. **Instant Rollback:**
   - Vercel Dashboard → Deployments
   - Find previous working deployment
   - Click "..." → "Promote to Production"

2. **Database Rollback:**
   - Supabase has automatic backups
   - Settings → Database → Backups
   - Restore if needed

3. **Debug in Preview:**
   - Create new branch
   - Push to trigger preview deployment
   - Test fixes in preview before production

---

## Success Criteria ✨

**Deployment is successful when:**

- ✅ Zero errors in Vercel logs
- ✅ Guest users can access and chat
- ✅ Registered users can login
- ✅ All AI providers respond
- ✅ Database queries execute in <100ms
- ✅ Page loads in <2s
- ✅ Lighthouse score >90
- ✅ No console errors in browser
- ✅ Mobile responsive
- ✅ SSL certificate valid

---

## 🎯 Timeline Estimate

- **Phase 1 (Database):** 15 minutes
- **Phase 2 (Vercel Config):** 20 minutes
- **Phase 3 (Code Review):** 15 minutes
- **Phase 4 (Deployment):** 10 minutes
- **Phase 5 (Verification):** 20 minutes
- **Phase 6 (Domain):** 30 minutes (optional)

**Total:** ~1.5 hours for elite, production-ready deployment

---

## 🚀 Ready to Start?

Follow phases in order. Don't skip steps. Test thoroughly at each phase.

**Next Step:** Phase 1 - Database Setup
