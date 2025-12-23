🚨 URGENT: Vercel Environment Variable Fix

**Issue:** Guest authentication failing with 500 error
**Root Cause:** Missing or incorrect database connection string in Vercel

**Hasid - Add/Update These Variables in Vercel:**

Go to: https://vercel.com/al-wilsons-projects/ai-chatbot/settings/environment-variables

**Add or verify these exist:**

```
DATABASE_URL=postgresql://postgres.iomzbddkmykfruslybxq:GZGLrGQV4bGRdrTZ@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true

POSTGRES_URL=postgresql://postgres:GZGLrGQV4bGRdrTZ@db.iomzbddkmykfruslybxq.supabase.co:5432/postgres

POSTGRES_PRISMA_URL=postgresql://postgres.iomzbddkmykfruslybxq:GZGLrGQV4bGRdrTZ@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connect_timeout=15

POSTGRES_URL_NON_POOLING=postgresql://postgres:GZGLrGQV4bGRdrTZ@db.iomzbddkmykfruslybxq.supabase.co:5432/postgres
```

**Critical Notes:**
1. Use the **pooled connection** (port 6543) for DATABASE_URL - required for serverless
2. Use the **direct connection** (port 5432) for migrations only
3. Select "Production" environment when adding
4. Click "Save" for each variable
5. After all variables are added: **Redeploy** from Deployments tab

**Verification:**
After redeploy, test: https://ai-chatbot-five-gamma-48.vercel.app/api/auth/guest

Expected: Successful guest login, redirect to chat

**Priority: IMMEDIATE** - Guest auth is critical for user onboarding.
