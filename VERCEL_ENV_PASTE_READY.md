# 🚀 VERCEL ENVIRONMENT VARIABLES - COPY/PASTE READY

## STEP 1: Change Build Command
Go to: Settings → Build & Development Settings
Change Build Command to: pnpm build

## STEP 2: Add These Environment Variables
Go to: Settings → Environment Variables
For each variable below, click "Add New" and paste:

---

### DATABASE (Production + Preview + Development)
POSTGRES_URL
postgresql://postgres.iomzbddkmykfruslybxq:GZGLrGQV4bGRdrTZ@aws-0-us-west-1.pooler.supabase.com:6543/postgres

DATABASE_URL
postgresql://postgres.iomzbddkmykfruslybxq:GZGLrGQV4bGRdrTZ@aws-0-us-west-1.pooler.supabase.com:6543/postgres

DIRECT_URL
postgresql://postgres:GZGLrGQV4bGRdrTZ@db.iomzbddkmykfruslybxq.supabase.co:5432/postgres

---

### SUPABASE (Production + Preview + Development)
NEXT_PUBLIC_SUPABASE_URL
https://iomzbddkmykfruslybxq.supabase.co

NEXT_PUBLIC_SUPABASE_ANON_KEY
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlvbXpiZGRrbXlrZnJ1c2x5YnhxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUwNDMwMjEsImV4cCI6MjA4MDYxOTAyMX0.TtWTiO0_8bLtrmUVmHCYE3j98XkvrYGI6MQkWZCKjqY

SUPABASE_SERVICE_ROLE_KEY
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlvbXpiZGRrbXlrZnJ1c2x5YnhxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUwNDMwMjEsImV4cCI6MjA4MDYxOTAyMX0.TtWTiO0_8bLtrmUVmHCYE3j98XkvrYGI6MQkWZCKjqY

---

### AUTH (Production Only)
NEXTAUTH_URL
https://ai-chatbot-five-gamma-48.vercel.app

NEXTAUTH_SECRET
[Generate new: openssl rand -base64 32]

AUTH_SECRET
[Same value as NEXTAUTH_SECRET]

---

### AI PROVIDERS (Keep Your Existing Values - Just Verify They Exist)
✅ GOOGLE_GENERATIVE_AI_API_KEY
✅ OPENAI_API_KEY
✅ ANTHROPIC_API_KEY (if you have one)

---

## STEP 3: After Adding All Variables
1. Click Save
2. Go to Deployments tab
3. Click "Redeploy" on latest deployment
4. Choose "Rebuild" (not using cache)

---

## 🎯 TOTAL VARIABLES TO ADD/UPDATE: 10
- 3 Database URLs
- 3 Supabase keys  
- 3 Auth secrets
- AI keys (already exist - just verify)

---

Ready to deploy! 🚀
