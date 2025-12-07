# Chat Streaming Migration Plan

## Overview

Migrate AI streaming from Next.js to FastAPI using the [Vercel AI SDK Python streaming implementation](https://raw.githubusercontent.com/vercel-labs/ai-sdk-preview-python-streaming/main/api/utils/stream.py).

## Complexity Assessment

**Estimated Time: 6-8 hours**

**Complexity: High** - But now feasible with the Python streaming reference!

## Key Components to Migrate

### 1. Streaming Infrastructure ✅ (Reference Available)
- Use the Vercel Python streaming code as base
- Adapt for xAI API (instead of OpenAI)
- Format SSE messages correctly for frontend

### 2. AI Provider Integration
- **Current**: Uses `@ai-sdk/gateway` with xAI models
- **Migration**: Call xAI API directly or use Vercel AI Gateway via HTTP
- Models to support:
  - `chat-model` → `xai/grok-2-vision-1212`
  - `chat-model-reasoning` → `xai/grok-3-mini`
  - `title-model` → `xai/grok-2-1212`
  - `artifact-model` → `xai/grok-2-1212`

### 3. Tools to Port (4 tools)

#### 3.1 `getWeather` ✅ (Easy)
- **Current**: TypeScript tool with geocoding + weather API
- **Migration**: Port to Python (straightforward HTTP calls)
- Dependencies: `httpx` for async HTTP

#### 3.2 `createDocument` ⚠️ (Medium)
- **Current**: Creates document, writes to dataStream, calls artifact handlers
- **Migration**:
  - Use FastAPI database queries (already available)
  - Write SSE events to stream (similar to dataStream.write)
  - Port artifact handlers or simplify

#### 3.3 `updateDocument` ⚠️ (Medium)
- **Current**: Updates document, writes to dataStream, calls artifact handlers
- **Migration**: Similar to createDocument

#### 3.4 `requestSuggestions` ⚠️ (Complex)
- **Current**: Uses `streamObject` from AI SDK to generate suggestions
- **Migration**:
  - Call xAI API for structured output
  - Stream suggestions as they're generated
  - Save to database

### 4. Additional Features

#### 4.1 System Prompts
- Port prompt logic from `lib/ai/prompts.ts`
- Handle geolocation hints (replace Vercel Functions geolocation)

#### 4.2 Usage Tracking
- **Current**: TokenLens integration
- **Migration**:
  - Extract usage from xAI API response
  - Store in chat context (already implemented)

#### 4.3 Message Saving
- **Current**: Saves assistant messages after stream completes
- **Migration**: Use existing `save_messages()` function

## Implementation Plan

### Phase 1: Streaming Infrastructure (2 hours)

1. **Create streaming utility** (`backend/app/utils/stream.py`)
   - Port the Vercel Python streaming code
   - Adapt for xAI API format
   - Handle SSE formatting

2. **Create AI client wrapper** (`backend/app/ai/client.py`)
   - xAI API client (or Vercel Gateway HTTP client)
   - Model mapping
   - Streaming support

### Phase 2: Basic Streaming (2 hours)

1. **Update FastAPI chat endpoint**
   - Replace Next.js proxy with direct streaming
   - Use streaming utility
   - Test basic text streaming

2. **System prompts**
   - Port prompt logic
   - Handle geolocation (use request headers or IP geolocation)

### Phase 3: Tools Migration (3-4 hours)

1. **Port `getWeather` tool** (30 min)
   - Straightforward HTTP calls

2. **Port `createDocument` tool** (1 hour)
   - Database operations
   - SSE event writing
   - Artifact handling

3. **Port `updateDocument` tool** (1 hour)
   - Similar to createDocument

4. **Port `requestSuggestions` tool** (1-2 hours)
   - Structured output from xAI
   - Streaming suggestions
   - Database saving

### Phase 4: Integration & Testing (1 hour)

1. **Message saving on completion**
2. **Usage tracking**
3. **Error handling**
4. **End-to-end testing**

## Technical Details

### xAI API Integration

**Option A: Direct xAI API**
```python
import httpx

async with httpx.AsyncClient() as client:
    response = await client.post(
        "https://api.x.ai/v1/chat/completions",
        headers={"Authorization": f"Bearer {XAI_API_KEY}"},
        json={
            "model": "grok-2-vision-1212",
            "messages": messages,
            "stream": True,
        },
        timeout=60.0,
    )
```

**Option B: Vercel AI Gateway** (if `AI_GATEWAY_URL` is set)
```python
async with httpx.AsyncClient() as client:
    response = await client.post(
        f"{AI_GATEWAY_URL}/v1/chat/completions",
        headers={"Authorization": f"Bearer {XAI_API_KEY}"},
        json={
            "model": "xai/grok-2-vision-1212",
            "messages": messages,
            "stream": True,
        },
    )
```

### SSE Event Format

The streaming utility should emit events in this format:
```
data: {"type": "start", "messageId": "msg-..."}\n\n
data: {"type": "text-start", "id": "text-1"}\n\n
data: {"type": "text-delta", "id": "text-1", "delta": "Hello"}\n\n
data: {"type": "text-delta", "id": "text-1", "delta": " world"}\n\n
data: {"type": "text-end", "id": "text-1"}\n\n
data: {"type": "finish", "messageMetadata": {...}}\n\n
data: [DONE]\n\n
```

### Tool Calling Format

For tools, emit:
```
data: {"type": "tool-input-start", "toolCallId": "...", "toolName": "getWeather"}\n\n
data: {"type": "tool-input-available", "toolCallId": "...", "toolName": "getWeather", "input": {...}}\n\n
data: {"type": "tool-output-available", "toolCallId": "...", "output": {...}}\n\n
```

## Dependencies Needed

```python
# backend/pyproject.toml or requirements.txt
httpx>=0.25.0  # For async HTTP (xAI API, weather, etc.)
pydantic>=2.0  # Already have
```

## Challenges & Solutions

### Challenge 1: Reasoning Model Middleware
- **Current**: Uses `extractReasoningMiddleware` for `chat-model-reasoning`
- **Solution**: Parse `<think>` tags from xAI response manually

### Challenge 2: Artifact Handlers
- **Current**: Complex TypeScript artifact handlers
- **Solution**: Simplify or port core logic only

### Challenge 3: Geolocation
- **Current**: Vercel Functions `geolocation()` API
- **Solution**: Use request headers (`x-vercel-ip-country`, etc.) or IP geolocation service

### Challenge 4: TokenLens Integration
- **Current**: TokenLens catalog for usage enrichment
- **Solution**: Use basic usage from API response, add TokenLens later if needed

## Testing Strategy

1. **Unit Tests**: Test each tool individually
2. **Integration Tests**: Test streaming with tools
3. **End-to-End**: Test full chat flow
4. **Compare**: Verify output matches Next.js implementation

## Rollback Plan

If migration has issues:
- Keep hybrid approach (already working)
- Can switch back via environment variable
- No breaking changes to frontend

## Next Steps

1. Review and adapt the Vercel Python streaming code
2. Set up xAI API client
3. Implement basic streaming (no tools)
4. Port tools one by one
5. Test and iterate
