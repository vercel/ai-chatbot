# TiQology Integration Guide

This document describes how to integrate this AI chatbot into TiQology-spa and use the Ghost Mode API for lightweight AI evaluations.

## Table of Contents

- [Overview](#overview)
- [Hardening Fixes](#hardening-fixes)
- [Ghost Mode API](#ghost-mode-api)
- [Integration Options](#integration-options)
- [Automation Script](#automation-script)
- [Environment Configuration](#environment-configuration)
- [Deployment](#deployment)

---

## Overview

This fork includes TiQology-specific enhancements:

1. **SSR/Hydration Fixes**: Eliminates React hydration errors for server-side rendering
2. **Ghost Mode API**: Lightweight endpoint for AI evaluations without persistent chat
3. **React Hook**: `useGhostEval` for easy integration from TiQology-spa
4. **Automation**: One-command script to apply all hardening fixes

---

## Hardening Fixes

### 1. Weather Component (`components/weather.tsx`)

**Problem**: Component rendered differently on server vs client due to `window.innerWidth` access.

**Fix**: Added `mounted` state to prevent hydration mismatch:

```tsx
const [mounted, setMounted] = useState(false);

useEffect(() => {
  setMounted(true);
}, []);

if (!mounted) {
  return null; // Don't render until client-side
}
```

**Impact**: Eliminates "Text content does not match" hydration errors in weather widget.

### 2. Multimodal Input (`components/multimodal-input.tsx`)

**Problem**: `localStorage` access during SSR caused hydration mismatches.

**Fix**: Added `mounted` guard to defer `localStorage` operations:

```tsx
const [mounted, setMounted] = useState(false);

useEffect(() => {
  setMounted(true);
}, []);

useEffect(() => {
  if (mounted) {
    setLocalStorageInput(input);
  }
}, [input, setLocalStorageInput, mounted]);
```

**Impact**: Prevents SSR errors when accessing browser-only APIs.

---

## Ghost Mode API

### What is Ghost Mode?

Ghost Mode provides a **stateless, lightweight API endpoint** for AI evaluations without requiring:
- User authentication
- Chat history persistence  
- Session management

Perfect for quick evaluations like:
- Form field validation
- Content moderation
- Quick Q&A without UI

### Endpoint

```
POST /api/ghost
```

### Request

```json
{
  "prompt": "Is this email address valid: user@example.com?",
  "context": {
    "field": "email",
    "value": "user@example.com"
  },
  "model": "chat-model"
}
```

**Fields**:
- `prompt` (required): The question or evaluation request
- `context` (optional): Additional structured data
- `model` (optional): `"chat-model"` (default) or `"chat-model-reasoning"`

### Response

```json
{
  "score": 95,
  "feedback": "Yes, user@example.com is a valid email format following RFC 5322 standards.",
  "result": "Score: 95\nFeedback: Yes, user@example.com is a valid email format following RFC 5322 standards.",
  "timestamp": "2024-12-05T10:00:00.000Z",
  "model": "chat-model"
}
```

**Fields**:
- `score`: Quality/confidence score from 0-100
- `feedback`: Brief evaluation summary (1-2 sentences)
- `result`: Full AI response text
- `timestamp`: ISO 8601 timestamp
- `model`: Model used for evaluation

### Error Response

```json
{
  "error": "Missing or invalid 'prompt' field"
}
```

**Status codes**:
- `200`: Success
- `400`: Bad request (missing/invalid fields)
- `401`: Unauthorized (invalid API key)
- `500`: Internal server error

### Security

Set `GHOST_MODE_API_KEY` in `.env.local` to require authentication:

```bash
GHOST_MODE_API_KEY=your-secret-key-here
```

Clients must include the header:

```
x-api-key: your-secret-key-here
```

---

## Integration Options

### Option 1: Micro-Frontend (iframe)

Embed the full chat UI in TiQology-spa:

```tsx
// In TiQology-spa
<iframe
  src="https://your-chatbot.vercel.app/chat"
  style={{
    width: '100%',
    height: '600px',
    border: 'none',
    borderRadius: '8px'
  }}
  title="AI Chat"
/>
```

**Pros**:
- Full chat experience
- No code integration needed
- Isolated state

**Cons**:
- Limited communication between apps
- Separate auth context

### Option 2: Ghost Mode API (Recommended for Forms)

Use the `useGhostEval` hook in TiQology-spa:

```tsx
// In TiQology-spa component
import { useGhostEval } from '@/hooks/use-ghost-eval';

function EmailValidator() {
  const { evaluate, isLoading, error } = useGhostEval({
    apiKey: process.env.NEXT_PUBLIC_GHOST_MODE_API_KEY,
    endpoint: 'https://your-chatbot.vercel.app/api/ghost'
  });

  const handleValidate = async (email: string) => {
    try {
      const result = await evaluate({
        prompt: `Is this a valid professional email address: ${email}?`,
        context: { field: 'email', value: email }
      });
      
      console.log('AI says:', result.result);
    } catch (err) {
      console.error('Validation failed:', err);
    }
  };

  return (
    <div>
      <input type="email" onChange={(e) => handleValidate(e.target.value)} />
      {isLoading && <span>Validating...</span>}
      {error && <span>Error: {error.message}</span>}
    </div>
  );
}
```

**Pros**:
- Lightweight, fast
- No UI dependencies
- Easy to integrate
- Stateless

**Cons**:
- No chat history
- Limited context

### Option 3: Direct API Calls

Use `fetch` directly from TiQology-spa:

```tsx
async function evaluateWithAI(prompt: string) {
  const response = await fetch('https://your-chatbot.vercel.app/api/ghost', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.GHOST_MODE_API_KEY
    },
    body: JSON.stringify({ prompt })
  });

  const data = await response.json();
  return data.result;
}
```

---

## Automation Script

### Running the Hardening Script

From a Codespace or local environment:

```bash
# Make script executable
chmod +x scripts/tiqology-harden.sh

# Run the script
./scripts/tiqology-harden.sh
```

### What the Script Does

1. ✅ Checks Git status and offers to stash changes
2. ✅ Syncs with `upstream/main` (vercel/ai-chatbot)
3. ✅ Installs dependencies (`pnpm` or `npm`)
4. ✅ Verifies `.env.local` exists
5. ✅ Checks for `GHOST_MODE_API_KEY` configuration
6. ✅ Verifies all hardening files are present
7. ✅ Runs TypeScript type checking
8. ✅ Tests dev server startup
9. ✅ Provides next steps

### Manual Steps (Without Script)

```bash
# 1. Sync with upstream
git fetch upstream
git rebase upstream/main

# 2. Install dependencies
pnpm install

# 3. Configure environment
cp .env.example .env.local
# Add your API keys to .env.local

# 4. Test
pnpm dev
pnpm build

# 5. Commit
git add .
git commit -m "feat: apply TiQology hardening fixes"
git push origin feature/tiqology-hardening
```

---

## Environment Configuration

### Required Variables

Copy `.env.example` to `.env.local` and configure:

```bash
# Authentication
AUTH_SECRET=<generate-random-secret>

# Google Gemini API (for AI models)
GOOGLE_GENERATIVE_AI_API_KEY=<your-google-api-key>

# Vercel Services (if deploying to Vercel)
BLOB_READ_WRITE_TOKEN=<vercel-blob-token>
POSTGRES_URL=<postgres-connection-string>
REDIS_URL=<redis-connection-string>

# Ghost Mode Security (optional but recommended)
GHOST_MODE_API_KEY=<your-secret-key>
```

### For TiQology-spa Integration

In your TiQology-spa `.env.local`:

```bash
# Point to your deployed chatbot
NEXT_PUBLIC_CHATBOT_URL=https://your-chatbot.vercel.app

# Ghost Mode API key (must match chatbot's GHOST_MODE_API_KEY)
NEXT_PUBLIC_GHOST_MODE_API_KEY=<your-secret-key>
```

---

## Deployment

### Deploy to Vercel

1. **Fork this repository** (already done)

2. **Connect to Vercel**:
   ```bash
   vercel link
   ```

3. **Set environment variables** in Vercel dashboard:
   - `GOOGLE_GENERATIVE_AI_API_KEY`
   - `GHOST_MODE_API_KEY`
   - `AUTH_SECRET`
   - Vercel will auto-create: `BLOB_READ_WRITE_TOKEN`, `POSTGRES_URL`, `REDIS_URL`

4. **Deploy**:
   ```bash
   git push origin main
   ```

Vercel will auto-deploy on push.

### Deployment Checklist

- [ ] Environment variables configured in Vercel
- [ ] `GHOST_MODE_API_KEY` matches between chatbot and TiQology-spa
- [ ] Database migrations run: `pnpm db:migrate`
- [ ] Build succeeds: `pnpm build`
- [ ] Ghost Mode endpoint accessible: `curl https://your-chatbot.vercel.app/api/ghost`
- [ ] CORS configured if needed for TiQology-spa domain

---

## Testing

### Test Ghost Mode Locally

```bash
# Start dev server
pnpm dev

# In another terminal, test the endpoint
curl -X POST http://localhost:3000/api/ghost \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-secret-key" \
  -d '{"prompt": "What is 2+2?"}'
```

Expected response:
```json
{
  "result": "2+2 equals 4.",
  "timestamp": "2024-12-05T10:00:00.000Z",
  "model": "chat-model"
}
```

### Test Hydration Fixes

```bash
# Build for production
pnpm build

# Start production server
pnpm start

# Open browser and check console for hydration errors
# Should see no errors in:
# - Weather widget
# - Chat input field
```

---

## Troubleshooting

### Hydration Errors Still Appearing

1. Clear `.next` cache:
   ```bash
   rm -rf .next
   pnpm dev
   ```

2. Check browser console for specific component
3. Verify `mounted` state pattern is applied correctly

### Ghost Mode 401 Unauthorized

- Ensure `GHOST_MODE_API_KEY` is set in `.env.local`
- Verify `x-api-key` header matches the environment variable
- Check Vercel environment variables if deployed

### Ghost Mode 500 Error

- Check server logs for detailed error
- Verify Google Gemini API key is valid
- Ensure model name is correct (`chat-model` or `chat-model-reasoning`)

### TypeScript Errors

```bash
# Regenerate types
pnpm exec tsc --noEmit

# Check for missing dependencies
pnpm install
```

---

## API Reference

### useGhostEval Hook

```tsx
const {
  evaluate,    // Function to call Ghost Mode API
  isLoading,   // Boolean: request in progress
  error,       // GhostEvalError | null
  lastResult   // GhostEvalResponse | null
} = useGhostEval({
  apiKey?: string,      // Optional: API key for authentication
  endpoint?: string     // Optional: Custom endpoint URL
});
```

#### Types

```typescript
interface GhostEvalRequest {
  prompt: string;
  context?: Record<string, unknown>;
  model?: "chat-model" | "chat-model-reasoning";
}

interface GhostEvalResponse {
  result: string;
  timestamp: string;
  model: string;
}

interface GhostEvalError {
  error: string;
  message?: string;
}
```

---

## Architecture

```
TiQology-spa                    AI Chatbot (this fork)
├─ User fills form              ├─ /app/api/ghost/route.ts
│  └─ Form validation           │  ├─ POST: Accept evaluation requests
│     └─ useGhostEval hook      │  ├─ Validate API key
│        └─ fetch() call ───────┼──┤ Call Gemini model
│                                │  └─ Return result
│                                │
├─ Chat iframe embed ───────────┼─ /app/(chat)/page.tsx
│  (Optional full UI)           │  └─ Full chat experience
│                                │
└─ Settings panel ──────────────┼─ /app/(auth)/settings/page.tsx
   (Future integration)         │  └─ User preferences
```

---

## Vercel Deployment

### Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **GitHub Repository**: Fork or push this repo to your GitHub account
3. **Required API Keys**: Obtain before deployment (see below)

### Required Environment Variables

When deploying to Vercel, configure these environment variables in your project settings:

#### Essential (Required for Basic Functionality)

```bash
# Authentication secret (generate at https://generate-secret.vercel.app/32)
AUTH_SECRET=your-random-32-char-secret

# Google AI API Key (get from https://aistudio.google.com/app/apikey)
GOOGLE_GENERATIVE_AI_API_KEY=your-google-api-key

# AI Provider: "google" for direct Gemini access
AI_PROVIDER=google

# Database (Vercel Postgres - auto-created when you add Vercel Postgres integration)
POSTGRES_URL=auto-populated-by-vercel

# Blob Storage (Vercel Blob - auto-created when you add Vercel Blob integration)
BLOB_READ_WRITE_TOKEN=auto-populated-by-vercel
```

#### Ghost Mode API (Optional but Recommended)

```bash
# Generate a secure random key for Ghost Mode API authentication
GHOST_MODE_API_KEY=your-secret-ghost-key
```

#### Optional (For Advanced Features)

```bash
# Redis for rate limiting (Vercel KV - auto-created with integration)
REDIS_URL=auto-populated-by-vercel

# AI Gateway (only if AI_PROVIDER=gateway)
AI_GATEWAY_API_KEY=your-gateway-key
```

### Deployment Steps

#### Option 1: Deploy via Vercel Dashboard (Recommended)

1. **Import Repository**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Click "Import Git Repository"
   - Select your fork: `MrAllgoodWilson/ai-chatbot`

2. **Configure Project**
   - Framework Preset: **Next.js** (auto-detected)
   - Root Directory: `./` (default)
   - Build Command: `pnpm build` (default)
   - Output Directory: `.next` (default)

3. **Add Integrations** (Before deploying)
   - Click "Storage" → Add "Vercel Postgres"
   - Click "Storage" → Add "Vercel Blob"
   - (Optional) Click "Storage" → Add "Vercel KV" for Redis

4. **Set Environment Variables**
   - Click "Environment Variables"
   - Add each variable from the list above
   - **Critical**: Set `AUTH_SECRET`, `GOOGLE_GENERATIVE_AI_API_KEY`, `AI_PROVIDER=google`, `GHOST_MODE_API_KEY`

5. **Deploy**
   - Click "Deploy"
   - Wait 2-3 minutes for build completion
   - Note your production URL: `https://your-project.vercel.app`

#### Option 2: Deploy via Vercel CLI

```bash
# Install Vercel CLI
pnpm add -g vercel

# Login to Vercel
vercel login

# Link project (first time only)
vercel link

# Set environment variables
vercel env add AUTH_SECRET production
vercel env add GOOGLE_GENERATIVE_AI_API_KEY production
vercel env add AI_PROVIDER production
vercel env add GHOST_MODE_API_KEY production

# Deploy to production
vercel --prod
```

### Post-Deployment Verification

1. **Health Check**
   ```bash
   curl https://your-project.vercel.app/api/ghost
   ```
   Expected response:
   ```json
   {
     "status": "healthy",
     "service": "ghost-mode",
     "version": "0.1.0"
   }
   ```

2. **Test Ghost Mode API**
   ```bash
   curl -X POST https://your-project.vercel.app/api/ghost \
     -H "Content-Type: application/json" \
     -H "x-api-key: your-ghost-mode-api-key" \
     -d '{
       "prompt": "Is the sky blue?",
       "context": {"source": "test"}
     }'
   ```
   Expected response:
   ```json
   {
     "score": 95,
     "feedback": "Yes, the sky appears blue due to Rayleigh scattering.",
     "result": "Score: 95\nFeedback: Yes, the sky appears blue...",
     "timestamp": "2024-12-06T10:00:00.000Z",
     "model": "chat-model"
   }
   ```

3. **Test Chat UI**
   - Visit `https://your-project.vercel.app`
   - Try sending a message
   - Verify reasoning works with Gemini models

### Ghost Mode Endpoint URLs

After deployment, your Ghost Mode API will be available at:

- **Production**: `https://your-project.vercel.app/api/ghost`
- **Preview** (from PRs): `https://your-project-git-branch.vercel.app/api/ghost`
- **Local**: `http://localhost:3000/api/ghost`

Use this URL in TiQology-spa configuration.

### Troubleshooting Deployment

#### Build Fails: "Cannot find module '@/lib/ai/providers'"

**Cause**: Missing environment variables at build time.

**Fix**: Ensure `GOOGLE_GENERATIVE_AI_API_KEY` and `AI_PROVIDER` are set in Vercel environment variables.

#### Runtime Error: "Missing API key"

**Cause**: Environment variables not propagated to runtime.

**Fix**: 
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Verify all variables are set for "Production" environment
3. Redeploy: `vercel --prod` or trigger via git push

#### Ghost Mode Returns 401 Unauthorized

**Cause**: API key mismatch or missing.

**Fix**:
- Verify `GHOST_MODE_API_KEY` is set in Vercel
- Ensure TiQology-spa sends correct `x-api-key` header
- Check Vercel logs: `vercel logs`

#### Database Migration Fails

**Cause**: Postgres URL not available during build.

**Fix**:
1. Ensure Vercel Postgres integration is added
2. Check that `POSTGRES_URL` is populated
3. Review build logs for migration errors
4. Manual migration if needed: `vercel env pull && pnpm db:migrate && git push`

### Performance Tips

1. **Edge Runtime**: Ghost Mode API uses Edge runtime for <100ms response times globally
2. **Caching**: Enable Vercel's caching for static assets
3. **Analytics**: Add Vercel Analytics to monitor API usage:
   ```bash
   pnpm add @vercel/analytics
   ```

### Security Best Practices

1. **Rotate Keys**: Regenerate `AUTH_SECRET` and `GHOST_MODE_API_KEY` every 90 days
2. **Rate Limiting**: Implement rate limits in production (future enhancement)
3. **CORS**: Configure allowed origins for Ghost Mode API if needed
4. **Audit Logs**: Monitor Vercel logs for unauthorized access attempts

---

## Contributing

### Making Changes

1. Create feature branch from `feature/tiqology-hardening`:
   ```bash
   git checkout -b feature/your-feature feature/tiqology-hardening
   ```

2. Make changes and test:
   ```bash
   pnpm dev
   pnpm build
   ```

3. Commit and push:
   ```bash
   git add .
   git commit -m "feat: your feature description"
   git push origin feature/your-feature
   ```

4. Open PR against `feature/tiqology-hardening` branch

---

## Version History

### v0.1.0 (Current)
- ✅ SSR/hydration fixes for `weather.tsx`
- ✅ localStorage guards in `multimodal-input.tsx`
- ✅ Ghost Mode API endpoint (`/api/ghost`)
- ✅ `useGhostEval` React hook
- ✅ Automation script (`tiqology-harden.sh`)
- ✅ Gemini model integration

### Planned (v0.2.0)
- [ ] Webhook notifications for Ghost Mode results
- [ ] Rate limiting for Ghost Mode API
- [ ] Caching layer for frequent evaluations
- [ ] Analytics dashboard for Ghost Mode usage

---

## Support

For issues or questions:
1. Check [Troubleshooting](#troubleshooting) section
2. Review Vercel deployment logs
3. Check browser console for client-side errors
4. Review server logs for API errors

---

## License

Same as upstream [vercel/ai-chatbot](https://github.com/vercel/ai-chatbot)
