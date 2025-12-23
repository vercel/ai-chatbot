# ✅ TiQology Deployment Checklist

**Date Started:** _____________  
**Completed By:** _____________

---

## Pre-Deployment

### Database
- [ ] Supabase project is active (not paused)
- [ ] Connection strings verified and saved
- [ ] Schema SQL script ready (`database-setup-complete.sql`)
- [ ] Tables created in Supabase
- [ ] Test query runs successfully

### Vercel Account
- [ ] Logged into Vercel dashboard
- [ ] Project identified: `ai-chatbot`
- [ ] Billing plan confirmed (if needed)

### Environment Variables Ready
- [ ] `POSTGRES_URL` (pooler connection)
- [ ] `DATABASE_URL` (pooler connection)
- [ ] `DIRECT_URL` (direct connection)
- [ ] `NEXTAUTH_SECRET` (generated fresh)
- [ ] `AUTH_SECRET` (same as NEXTAUTH_SECRET)
- [ ] `NEXTAUTH_URL` (production URL)
- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `GOOGLE_GENERATIVE_AI_API_KEY`
- [ ] `OPENAI_API_KEY`

---

## Phase 1: Database Setup

- [ ] Open Supabase SQL Editor
- [ ] Copy entire `database-setup-complete.sql`
- [ ] Execute SQL script
- [ ] Verify 7+ tables created
- [ ] Run verification query:
  ```sql
  SELECT tablename FROM pg_tables WHERE schemaname = 'public';
  ```
- [ ] Confirm User table has correct columns

**Result:** ✅ Database ready

---

## Phase 2: Vercel Configuration

### Environment Variables
- [ ] Navigate to Settings → Environment Variables
- [ ] Add/Update `POSTGRES_URL` (Production + Preview)
- [ ] Add/Update `DATABASE_URL` (Production + Preview)
- [ ] Add/Update `DIRECT_URL` (Production only)
- [ ] Add/Update `NEXTAUTH_URL` (Production only)
- [ ] Add/Update `NEXTAUTH_SECRET` (All Environments)
- [ ] Add/Update `AUTH_SECRET` (All Environments)
- [ ] Add/Update Supabase variables (All Environments)
- [ ] Verify AI API keys exist
- [ ] Click **Save** after each variable

### Build Settings
- [ ] Navigate to Settings → Build & Development Settings
- [ ] Framework Preset: **Next.js** (verified)
- [ ] Build Command: **`pnpm build`** (no migrations)
- [ ] Output Directory: **`.next`** (default/empty)
- [ ] Install Command: **`pnpm install`** (default/empty)
- [ ] Root Directory: **(empty)**
- [ ] Node.js Version: **20.x**
- [ ] Click **Save**

**Result:** ✅ Vercel configured

---

## Phase 3: Code Verification

- [ ] Check current branch: `git branch`
- [ ] Working directory clean: `git status`
- [ ] All changes committed
- [ ] Pushed to remote: `git push`
- [ ] No TypeScript errors locally: `pnpm build` (test)
- [ ] Dependencies up to date: `pnpm install`

**Result:** ✅ Code ready

---

## Phase 4: Deployment

- [ ] Navigate to Vercel → Deployments
- [ ] Click **"Redeploy"** on latest OR push new commit
- [ ] Monitor build logs
- [ ] Build completes without errors
- [ ] Deployment shows **"Ready"** status
- [ ] Production URL is live

**Build Log Checks:**
- [ ] ✅ Installing dependencies...
- [ ] ✅ Running "pnpm build"
- [ ] ✅ Creating an optimized production build
- [ ] ✅ Compiled successfully
- [ ] ✅ Build Completed

**Result:** ✅ Deployed successfully

---

## Phase 5: Functional Testing

### Guest User Test
- [ ] Open production URL
- [ ] Page loads without errors
- [ ] Browser console has no errors
- [ ] Guest user auto-created (check Vercel logs)
- [ ] Send test message
- [ ] AI responds successfully

### Registered User Test
- [ ] Navigate to `/register`
- [ ] Register new account with test email
- [ ] Receive success confirmation
- [ ] Navigate to `/login`
- [ ] Login with test credentials
- [ ] Redirected to chat
- [ ] Create new chat
- [ ] Send message as registered user
- [ ] AI responds successfully

### Database Test
- [ ] Open Supabase SQL Editor
- [ ] Run: `SELECT * FROM "User" ORDER BY created_at DESC LIMIT 5;`
- [ ] Verify guest users created
- [ ] Verify registered user created
- [ ] Run: `SELECT * FROM "Chat" LIMIT 5;`
- [ ] Verify chats created
- [ ] Run: `SELECT * FROM "Message_v2" LIMIT 5;`
- [ ] Verify messages stored

**Result:** ✅ All features working

---

## Phase 6: Performance & Quality

### Performance
- [ ] Run Lighthouse audit (Chrome DevTools)
- [ ] Performance score: _____ (target: 90+)
- [ ] Accessibility score: _____ (target: 90+)
- [ ] Best Practices score: _____ (target: 90+)
- [ ] SEO score: _____ (target: 90+)

### Logs & Errors
- [ ] Check Vercel Function Logs (last 1 hour)
- [ ] No authentication errors
- [ ] No database connection errors
- [ ] No 500 errors
- [ ] Response times <1s average

### Cross-Browser Test
- [ ] Chrome: Works ✅
- [ ] Firefox: Works ✅
- [ ] Safari: Works ✅
- [ ] Mobile Safari: Works ✅
- [ ] Mobile Chrome: Works ✅

**Result:** ✅ Performance verified

---

## Phase 7: Post-Deployment Monitoring

### First Hour
- [ ] Monitor Vercel logs every 15 minutes
- [ ] Check for error spikes
- [ ] Verify user activity

### First Day
- [ ] Morning check: Logs & performance
- [ ] Afternoon check: User engagement
- [ ] Evening check: Error rate

### First Week
- [ ] Daily log reviews
- [ ] Weekly analytics review
- [ ] Database performance check

**Result:** ✅ Monitoring active

---

## Optional: Custom Domain

- [ ] Domain purchased/available
- [ ] Added in Vercel → Domains
- [ ] DNS configured (CNAME record)
- [ ] SSL certificate issued (automatic)
- [ ] Domain verified
- [ ] `NEXTAUTH_URL` updated to custom domain
- [ ] Redeployed with new URL

---

## Sign-Off

### Final Verification
- [ ] All features working as expected
- [ ] No console errors
- [ ] No server errors
- [ ] Database queries executing properly
- [ ] AI responses working
- [ ] Performance acceptable
- [ ] Mobile responsive
- [ ] SSL valid

### Documentation
- [ ] Deployment date recorded
- [ ] Environment variables documented
- [ ] Known issues (if any) documented
- [ ] Rollback plan confirmed

---

## 🎉 Deployment Complete

**Production URL:** https://ai-chatbot-five-gamma-48.vercel.app  
**Status:** ✅ Live and Operational  
**Deployed By:** _____________  
**Date:** _____________  
**Time:** _____________

---

## Emergency Contacts

**Vercel Support:** https://vercel.com/support  
**Supabase Support:** https://supabase.com/support  
**Project Repository:** https://github.com/vercel/ai-chatbot

---

**Notes:**
_____________________________________________________________________________
_____________________________________________________________________________
_____________________________________________________________________________
