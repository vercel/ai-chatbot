# 🚨 FIX AUTHENTICATION ERROR - Action Required

## Current Issue
```
Error: Failed to create guest user
Cause: Database query error (User table doesn't exist)
```

Your Vercel deployment **cannot authenticate users** because the database schema hasn't been created.

---

## ✅ QUICK FIX (Choose ONE method)

### **Method 1: Auto-Deploy with Migrations** ⚡ RECOMMENDED

**Steps:**
1. Open Vercel Dashboard: https://vercel.com/dashboard
2. Go to your project → **Settings** → **General**
3. Scroll to **Build & Development Settings**
4. Change **Build Command** from:
   ```
   pnpm build
   ```
   to:
   ```
   pnpm build:with-migrate
   ```
5. Click **Save**
6. Go to **Deployments** → Click **Redeploy** (use latest commit)

**What this does:**
- Runs database migrations automatically before build
- Creates all required tables (User, Chat, Message_v2, etc.)
- Future deployments will keep schema up-to-date

---

### **Method 2: Manual Database Setup** 🛠️

**If you prefer direct control:**

1. Go to Supabase SQL Editor:
   ```
   https://supabase.com/dashboard/project/iomzbddkmykfruslybxq/sql
   ```

2. Open the file: `database-setup-complete.sql` (created in this workspace)

3. **Copy ALL the SQL** and paste into Supabase SQL Editor

4. Click **Run** to execute

5. Verify tables were created (you should see row counts at the end)

6. **No need to change Vercel build command** - tables are already set up

---

## 🧪 Verify the Fix

After deploying:

1. Visit your site: https://ai-chatbot-five-gamma-48.vercel.app
2. Open without logging in (should auto-create guest user)
3. Check Vercel logs - should see no auth errors
4. Try sending a message as guest

---

## 📊 What Tables Were Created

| Table | Purpose |
|-------|---------|
| User | Stores user accounts (email, password) |
| Chat | Chat sessions with metadata |
| Message_v2 | Individual messages in chats |
| Document | Artifact documents |
| Stream | Real-time streaming data |
| Vote_v2 | Message upvote/downvote |
| Suggestion | Document edit suggestions |

---

## ❓ Why Did This Happen?

Your codebase has migration files (`lib/db/migrations/*.sql`) but they weren't executed on your production database. The app code tries to insert users into tables that don't exist yet.

**Root cause:** Vercel build doesn't run migrations by default - you need to explicitly use `build:with-migrate` script.

---

## 🎯 Recommendation

**Use Method 1 (Auto-Deploy)** because:
- ✅ Future migrations run automatically
- ✅ No manual SQL execution needed
- ✅ Schema stays in sync with codebase
- ✅ Works for all environments (dev, staging, prod)

---

## 🆘 Still Having Issues?

If you see the error after fixing:

1. **Check environment variable:**
   ```
   POSTGRES_URL = postgresql://postgres:GZGLrGQV4bGRdrTZ@db.iomzbddkmykfruslybxq.supabase.co:5432/postgres
   ```
   (Should be set in Vercel → Settings → Environment Variables → Production)

2. **Verify database connection:**
   - Supabase project should be active (not paused)
   - Password should match what's in POSTGRES_URL

3. **Check Supabase logs:**
   - Go to Supabase Dashboard → Logs
   - Look for connection errors or permission issues

---

## 📝 Next Steps After Fix

Once authentication works:

1. ✅ Test guest user functionality
2. ✅ Test registered user login
3. ✅ Verify chat creation works
4. ✅ Check message persistence
5. ✅ Test AI responses

---

**Need help?** Share your Vercel deployment logs if the error persists.
