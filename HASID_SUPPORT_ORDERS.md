# 🧰 HASID - Phase III Stage 2 Support Orders

**Priority:** 🔴 **CRITICAL**  
**Timeline:** 48 hours  
**Status:** Awaiting Execution

---

## 📋 Mission Briefing

Hasid, you are the infrastructure operator for TiQology Phase III deployment. Devin has completed all code implementation. Your mission is to prepare the infrastructure and execute database migrations to enable staging deployment.

---

## ✅ Task 1: Fix Guest Authentication 500 Error

**Priority:** IMMEDIATE  
**Estimated Time:** 15 minutes

### Problem:
Guest authentication endpoint returning 500 error due to missing pooled database connection.

### Solution:
Add the following environment variables to Vercel:

1. Go to: https://vercel.com/al-wilsons-projects/ai-chatbot/settings/environment-variables

2. Add these variables (select **Production** environment):

```bash
# Pooled connection for serverless functions (REQUIRED)
DATABASE_URL=postgresql://postgres.iomzbddkmykfruslybxq:GZGLrGQV4bGRdrTZ@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true

# Prisma-specific pooled connection
POSTGRES_PRISMA_URL=postgresql://postgres.iomzbddkmykfruslybxq:GZGLrGQV4bGRdrTZ@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connect_timeout=15

# Direct connection (for migrations only)
POSTGRES_URL_NON_POOLING=postgresql://postgres:GZGLrGQV4bGRdrTZ@db.iomzbddkmykfruslybxq.supabase.co:5432/postgres

# Standard connection
POSTGRES_URL=postgresql://postgres:GZGLrGQV4bGRdrTZ@db.iomzbddkmykfruslybxq.supabase.co:5432/postgres
```

3. Click "Save" for each variable

4. Go to **Deployments** tab → Click latest deployment → Click "Redeploy"

5. **Verify:** Test https://ai-chatbot-five-gamma-48.vercel.app/api/auth/guest

**Expected Result:** Successful guest login and redirect

---

## ✅ Task 2: Run Database Migrations

**Priority:** HIGH  
**Estimated Time:** 10 minutes  
**Dependencies:** Requires direct database access

### Steps:

1. **Locate migration file:**
   ```bash
   cd /workspaces/ai-chatbot
   cat db/migrations/phase_iii_tables.sql
   ```

2. **Execute migration:**
   ```bash
   psql postgresql://postgres:GZGLrGQV4bGRdrTZ@db.iomzbddkmykfruslybxq.supabase.co:5432/postgres \
     -f db/migrations/phase_iii_tables.sql
   ```

3. **Verify tables created:**
   ```sql
   -- Connect to database and run:
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name IN ('governance_audit', 'agent_state', 'privacy_logs', 'context_state');
   ```

4. **Verify RLS enabled:**
   ```sql
   SELECT tablename, rowsecurity 
   FROM pg_tables 
   WHERE schemaname = 'public' 
   AND tablename IN ('governance_audit', 'agent_state', 'privacy_logs', 'context_state');
   ```

**Expected Result:** All 4 tables exist with `rowsecurity = true`

---

## ✅ Task 3: Enable Supabase Realtime

**Priority:** HIGH  
**Estimated Time:** 5 minutes

### Steps:

1. Go to: https://supabase.com/dashboard/project/iomzbddkmykfruslybxq

2. Navigate to: **Database** → **Replication**

3. Enable Realtime for these tables:
   - ☑️ `agent_state`
   - ☑️ `governance_audit`
   - ☑️ `privacy_logs`
   - ☑️ `context_state`

4. Click "Save" and wait for replication to sync (~30 seconds)

**Expected Result:** Green checkmarks next to all 4 tables

---

## ✅ Task 4: Verify RLS Policies

**Priority:** MEDIUM  
**Estimated Time:** 5 minutes

### Steps:

1. **Connect to database:**
   ```bash
   psql postgresql://postgres:GZGLrGQV4bGRdrTZ@db.iomzbddkmykfruslybxq.supabase.co:5432/postgres
   ```

2. **List policies:**
   ```sql
   SELECT schemaname, tablename, policyname, permissive, roles, cmd
   FROM pg_policies
   WHERE tablename IN ('governance_audit', 'agent_state', 'privacy_logs', 'context_state')
   ORDER BY tablename, policyname;
   ```

3. **Count policies (should be 12 total):**
   ```sql
   SELECT COUNT(*) FROM pg_policies
   WHERE tablename IN ('governance_audit', 'agent_state', 'privacy_logs', 'context_state');
   ```

**Expected Result:** 12 policies total:
- governance_audit: 2 policies
- agent_state: 2 policies
- privacy_logs: 3 policies  
- context_state: 2 policies

---

## ✅ Task 5: Test Command Center Dashboard

**Priority:** MEDIUM  
**Estimated Time:** 5 minutes  
**Dependencies:** Requires running dev server

### Steps:

1. **Start development server:**
   ```bash
   cd /workspaces/ai-chatbot
   pnpm dev
   ```

2. **Open Command Center:**
   ```bash
   open http://localhost:3000/command-center.html
   ```
   Or visit manually in browser

3. **Verify dashboard loads:**
   - ✅ All 6 cards display
   - ✅ WebSocket connection shows "Connected"
   - ✅ Real-time data updates (every 5 seconds)
   - ✅ No console errors

4. **Take screenshot for documentation**

**Expected Result:** Dashboard operational with live data

---

## ✅ Task 6: Deliver Confirmation Report

**Priority:** MEDIUM  
**Estimated Time:** 10 minutes

### Create a file: `HASID_PHASE_III_COMPLETION.md`

Include:
1. ✅ Checklist of completed tasks
2. 📸 Screenshot of Command Center dashboard
3. 📊 Database verification results:
   - Table count (should be 4)
   - RLS policy count (should be 12)
   - Realtime replication status
4. 🧪 Test results:
   - Guest auth endpoint working
   - Command Center accessible
   - WebSocket connection stable
5. ⏱️ Telemetry baseline:
   - Current cost: $X
   - Active agents: 13/13
   - System health: X%
   - Response time: Xms

### Share with:
- Commander @MrAllgoodWilson
- Devin (this chat)

---

## 🚨 Troubleshooting Guide

### Issue: Migration fails with "table already exists"
**Solution:** Drop existing tables first:
```sql
DROP TABLE IF EXISTS governance_audit, agent_state, privacy_logs, context_state CASCADE;
```
Then re-run migration.

### Issue: RLS policies not working
**Solution:** Verify service role key in `.env`:
```bash
SUPABASE_SERVICE_ROLE_KEY=sb_secret_sozUmtJE-6zfQL2DutXRsA_eKSKPqKy
```

### Issue: Command Center shows "Disconnected"
**Solution:** WebSocket endpoint needs to be created. For now, dashboard will use simulated data (5-second intervals).

### Issue: Realtime replication not enabling
**Solution:** Check Supabase project plan. Realtime requires Pro plan or higher. Free tier has limits.

---

## 📞 Escalation

**If blocked:** Report to Commander @MrAllgoodWilson with:
1. Task number blocked on
2. Error messages (full stack trace)
3. Steps attempted
4. Current status of other tasks

---

## 🎯 Success Criteria

**ALL tasks must be complete before Stage 3 (Staging Deployment)**

- [ ] Guest auth working in production
- [ ] 4 tables created with RLS
- [ ] 12 RLS policies active
- [ ] Supabase Realtime enabled
- [ ] Command Center accessible
- [ ] Confirmation report delivered

**Once complete:** Report to Commander with telemetry baseline and await staging deployment authorization.

---

**Orders Issued:** December 22, 2025  
**Authorized by:** Commander @MrAllgoodWilson  
**Operational Support:** Devin AI Engineering Agent

🫡 **Execute with precision. Report completion status within 48 hours.**
