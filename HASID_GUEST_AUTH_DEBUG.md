# 🚨 HASID - Guest Auth 500 Error Debug Guide

**Current Error:** HTTP 500 on `/api/auth/guest`  
**Deployment:** https://ai-chatbot-ddk0f7ou8-al-wilsons-projects.vercel.app  
**Status:** 🔴 CRITICAL - Users cannot access the app

---

## 🔍 Root Cause Analysis

The `/api/auth/guest` endpoint is failing because:

1. It calls `createGuestUser()` function
2. Which tries to insert into database using `drizzle(client)`
3. The `client` is initialized with `process.env.POSTGRES_URL`
4. **This environment variable is either missing or malformed in Vercel**

**Code Flow:**
```
Guest button clicked
  ↓
/api/auth/guest route
  ↓
signIn("guest")
  ↓
authorize() in auth.ts
  ↓
createGuestUser() in queries.ts (LINE 66)
  ↓
db.insert(user).values({...})
  ↓
💥 DATABASE CONNECTION ERROR → 500
```

---

## 🎯 SOLUTION - Step-by-Step Fix

### Step 1: Check Current Environment Variables

1. Go to: https://vercel.com/al-wilsons-projects/ai-chatbot/settings/environment-variables

2. **Look for these 4 variables:**
   - DATABASE_URL
   - POSTGRES_URL
   - POSTGRES_PRISMA_URL
   - POSTGRES_URL_NON_POOLING

3. **Take a screenshot** of what you see (we need to verify they're correct)

---

### Step 2: Verify Variable Values

**Click on each variable to see its value. Check if they match EXACTLY:**

#### ✅ DATABASE_URL Should Be:
```
postgresql://postgres.iomzbddkmykfruslybxq:GZGLrGQV4bGRdrTZ@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true
```

**Check for:**
- ✅ Starts with `postgresql://`
- ✅ Username: `postgres.iomzbddkmykfruslybxq`
- ✅ Password: `GZGLrGQV4bGRdrTZ`
- ✅ Host: `aws-0-us-east-1.pooler.supabase.com`
- ✅ Port: `6543`
- ❌ NOT missing protocol
- ❌ NOT starting with just the password

---

#### ✅ POSTGRES_URL Should Be:
```
postgresql://postgres:GZGLrGQV4bGRdrTZ@db.iomzbddkmykfruslybxq.supabase.co:5432/postgres
```

**Check for:**
- ✅ Starts with `postgresql://`
- ✅ Username: `postgres` (NOT `postgres.iomzbddkmykfruslybxq`)
- ✅ Password: `GZGLrGQV4bGRdrTZ`
- ✅ Host: `db.iomzbddkmykfruslybxq.supabase.co`
- ✅ Port: `5432`

---

#### ✅ POSTGRES_PRISMA_URL Should Be:
```
postgresql://postgres.iomzbddkmykfruslybxq:GZGLrGQV4bGRdrTZ@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connect_timeout=15
```

---

#### ✅ POSTGRES_URL_NON_POOLING Should Be:
```
postgresql://postgres:GZGLrGQV4bGRdrTZ@db.iomzbddkmykfruslybxq.supabase.co:5432/postgres
```

---

### Step 3: If Variables Are Wrong or Missing

**Option A: Fix via Vercel Dashboard**

1. **Delete the broken variables:**
   - Click the "⋯" menu next to each variable
   - Select "Remove"
   - Confirm deletion

2. **Add corrected variables:**
   - Click "Add New" button
   - Name: `DATABASE_URL`
   - Value: (paste EXACT value from above)
   - Environment: Check ✅ **Production**
   - Click "Save"
   
   Repeat for all 4 variables.

3. **Redeploy:**
   - Go to: https://vercel.com/al-wilsons-projects/ai-chatbot/deployments
   - Click latest deployment
   - Click "⋯" → "Redeploy"
   - Wait 3-5 minutes

---

**Option B: Fix via Vercel CLI** (Faster)

```bash
# Install CLI if needed
npm i -g vercel@latest

# Login
vercel login

# Remove old variables (if they exist)
vercel env rm DATABASE_URL production
vercel env rm POSTGRES_URL production
vercel env rm POSTGRES_PRISMA_URL production
vercel env rm POSTGRES_URL_NON_POOLING production

# Add correct variables
vercel env add DATABASE_URL production
# When prompted, paste: postgresql://postgres.iomzbddkmykfruslybxq:GZGLrGQV4bGRdrTZ@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true

vercel env add POSTGRES_URL production
# When prompted, paste: postgresql://postgres:GZGLrGQV4bGRdrTZ@db.iomzbddkmykfruslybxq.supabase.co:5432/postgres

vercel env add POSTGRES_PRISMA_URL production
# When prompted, paste: postgresql://postgres.iomzbddkmykfruslybxq:GZGLrGQV4bGRdrTZ@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connect_timeout=15

vercel env add POSTGRES_URL_NON_POOLING production
# When prompted, paste: postgresql://postgres:GZGLrGQV4bGRdrTZ@db.iomzbddkmykfruslybxq.supabase.co:5432/postgres

# Redeploy
vercel --prod
```

---

### Step 4: Verify the Fix

**After redeployment completes:**

1. **Check build logs:**
   - Go to: https://vercel.com/al-wilsons-projects/ai-chatbot/deployments
   - Click the latest deployment
   - Click "Building" → "View Function Logs"
   - Look for errors related to database connection
   - Should see: `✓ Compiled successfully`

2. **Test the endpoint:**
   - Open new incognito window
   - Go to: https://ai-chatbot-five-gamma-48.vercel.app
   - Click "Continue as Guest"
   - **Expected:** Redirects to chat interface
   - **If 500 still appears:** Continue to Step 5

---

### Step 5: Advanced Debugging (If Still Failing)

**Get detailed error logs:**

1. Go to: https://vercel.com/al-wilsons-projects/ai-chatbot/logs

2. Filter by:
   - Deployment: Latest
   - Function: `/api/auth/guest`
   - Status: Error (500)

3. **Look for error messages like:**
   - `ERR_INVALID_URL`
   - `connect ECONNREFUSED`
   - `password authentication failed`
   - `database "postgres" does not exist`
   - `timeout`

4. **Take screenshot of error** and share with Devin

---

## 🔍 Common Issues & Solutions

### Issue 1: "ERR_INVALID_URL"
**Cause:** Missing `postgresql://` prefix  
**Fix:** Verify variable starts with `postgresql://`

### Issue 2: "password authentication failed"
**Cause:** Wrong password in URL  
**Fix:** Verify password is `GZGLrGQV4bGRdrTZ`

### Issue 3: "connect ECONNREFUSED"
**Cause:** Wrong host or port  
**Fix:** Verify pooled host uses port 6543, direct uses 5432

### Issue 4: "timeout"
**Cause:** Serverless function using direct connection (port 5432)  
**Fix:** Ensure `DATABASE_URL` and `POSTGRES_PRISMA_URL` use pooled (port 6543)

### Issue 5: Still 500 after correct variables
**Cause:** Old deployment cached  
**Fix:** 
```bash
# Force clean redeploy
vercel --prod --force
```

---

## 📋 Verification Checklist

Before saying "it's fixed", verify ALL of these:

### Environment Variables ✅
- [ ] `DATABASE_URL` exists in Production environment
- [ ] `DATABASE_URL` starts with `postgresql://`
- [ ] `DATABASE_URL` uses port `6543` (pooled)
- [ ] `POSTGRES_URL` exists in Production environment
- [ ] `POSTGRES_URL` uses port `5432` (direct)
- [ ] All 4 database variables present

### Build Status ✅
- [ ] Latest deployment shows "Ready" status
- [ ] Build logs show "✓ Compiled successfully"
- [ ] No build errors in logs
- [ ] Function logs show no database errors

### Functionality ✅
- [ ] Production URL loads: https://ai-chatbot-five-gamma-48.vercel.app
- [ ] "Continue as Guest" button visible
- [ ] Clicking button redirects to chat (no 500)
- [ ] Chat interface loads
- [ ] Can send a test message

---

## 🎯 Quick Diagnosis

**Run this test to isolate the issue:**

1. Open browser console (F12)
2. Go to production URL
3. Run this in console:
```javascript
fetch('https://ai-chatbot-five-gamma-48.vercel.app/api/auth/guest?redirectUrl=/')
  .then(r => r.text())
  .then(console.log)
  .catch(console.error)
```

**What to look for:**
- If you see HTML with "500" → Database connection failing
- If you get redirected → Guest auth working!
- If you see "CORS error" → Try from the actual site, not console

---

## 🚨 If Nothing Works

**Escalation Steps:**

1. **Screenshot the following:**
   - Vercel environment variables page (blur sensitive values)
   - Build logs (last 50 lines)
   - Function logs showing the 500 error
   - Browser console error (F12 → Console tab)

2. **Try Supabase connection test:**
   - Go to: https://supabase.com/dashboard/project/iomzbddkmykfruslybxq
   - Click "Database" → "Connection info"
   - Verify connection strings match what you have in Vercel
   - Test connection using "Test connection" button

3. **Report to Devin with:**
   - "Environment variables are correct (screenshot attached)"
   - "Build succeeds but runtime fails (logs attached)"
   - "Exact error message from Vercel logs: [paste here]"

---

## 🔄 Emergency Rollback

**If you need to revert to a working deployment:**

1. Go to: https://vercel.com/al-wilsons-projects/ai-chatbot/deployments
2. Find a deployment that was working before
3. Click "⋯" → "Promote to Production"
4. This will make that old deployment live again

---

## 📊 Expected Timeline

| Step | Time | Status |
|------|------|--------|
| Check environment variables | 2 min | ⏳ |
| Update if incorrect | 5 min | ⏳ |
| Redeploy | 3 min | ⏳ |
| Test guest auth | 1 min | ⏳ |
| **Total** | **~10 min** | ⏳ |

---

## ✅ Success Indicator

**You'll know it's fixed when:**

1. ✅ No 500 error on `/api/auth/guest`
2. ✅ Clicking "Continue as Guest" redirects to chat
3. ✅ Can send messages as guest user
4. ✅ Vercel function logs show no database errors
5. ✅ Build completes successfully with no warnings

---

**Summary:** The guest authentication is trying to create a user in the database, but the database connection is failing. Fix the `POSTGRES_URL` and `DATABASE_URL` environment variables in Vercel with the complete connection strings (including `postgresql://` prefix), then redeploy.

⏱️ **Priority:** 🔴 CRITICAL - Blocking all users  
🎯 **Fix Time:** 10 minutes if variables are wrong  

**Report back with environment variable screenshot if still failing!**
