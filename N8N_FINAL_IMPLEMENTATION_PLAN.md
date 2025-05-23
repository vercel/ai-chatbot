# N8N Final Implementation Plan

## Current N8N Webhook Flow (Changed Today)

### Previous Flow (3 days ago):
- Vercel calls n8n webhook 
- n8n responds directly to the webhook call
- Response came back synchronously

### Current Flow (Changed Today):
1. **Vercel → n8n webhook**
   - Authentication: `N8N_WEBHOOK_SECRET_KEY`
   - n8n receives the webhook call from Vercel

2. **n8n processes** (1-12+ minutes with long-running tools)

3. **n8n → Vercel callback**
   - POST to `/api/n8n-callback`
   - Authentication: `N8N_CALLBACK_SECRET_KEY`
   - n8n sends response back when processing complete

## Authentication Keys:
- **N8N_WEBHOOK_SECRET_KEY**: Vercel → n8n authentication
- **N8N_CALLBACK_SECRET_KEY**: n8n → Vercel authentication

## Current App Behavior & Problem

### Current "Thinking..." Animation:
- **All models** (n8n and non-n8n) show "Thinking..." animation when waiting for LLM response
- This is the standard Vercel AI SDK thinking state with animation
- **NOT a database message** - it's a UI state

### The Problem:
- For **n8n models**: Animation times out after ~60 seconds
- This is the entire origin of the problem we're solving
- n8n workflows with long-running tools take 1-12+ minutes

## Desired Behavior

### Short Term Solution:
- Show the **SAME EXACT "Thinking..." animation** (not database pollution)
- Keep animation running until n8n POST response arrives at `/api/n8n-callback`
- Extend timeout to **10-15 minutes** instead of 60 seconds
- When n8n response arrives, replace thinking animation with actual response

### Long Term Possibilities:
- **Streaming**: Convert to streaming responses from n8n
- **Multiple POST responses**: n8n sends multiple callbacks based on different tools used
- **Migration**: Move n8n workflows/tools into this codebase directly (off n8n platform)

## N8N Platform Limitations & Constraints

### N8N Streaming Capability:
- **n8n CANNOT stream responses natively**
- n8n has JavaScript/Python execution in code nodes (function nodes)
- **We will NOT use hacky solutions** with code nodes for streaming
- **Assumption**: n8n will run 1s to 10 minutes per message and POST only when complete

### Vercel Timeout Challenge:
- Vercel times out at 60 seconds
- n8n workflows can take up to 10 minutes
- **Must avoid timeout while maintaining thinking animation**

### Potential Solutions for Timeout:
1. **Keep stream alive**: Send periodic messages from system to itself during wait
2. **Different async paradigm**: Use alternative approach to maintain connection
3. **Extend timeout**: Configure longer timeout if possible
4. **Background processing**: Complete disconnect from stream, rely purely on callback

## IMMEDIATE ISSUE - BUILD FAILURE BLOCKING DEPLOYMENT

### TypeScript Error:
```
./app/(chat)/api/chat/route.ts:34:35
Type error: Type 'string | undefined' is not assignable to type 'string'.
Type 'undefined' is not assignable to type 'string'.

const client = new MemoryClient({ apiKey: process.env.MEM0_API_KEY });
```

### Problem:
- `process.env.MEM0_API_KEY` can be `undefined`
- MemoryClient constructor expects `string`
- **BLOCKING ALL DEPLOYMENTS AND TESTING**

### Fix Required:
- Handle undefined environment variable properly
- Must fix immediately to allow deployment 