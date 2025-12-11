# Chat POST Endpoint Migration Plan

## Overview

The POST `/api/chat` endpoint is the **most complex endpoint** in the application. It handles AI streaming, tool integration, rate limiting, and message persistence. This migration requires careful planning and incremental implementation.

## Complexity Assessment

**Estimated Time: 8-12 hours** (depending on tool migration complexity)

**Complexity: Very High** ⚠️

### Why It's Complex

1. **AI SDK Integration** - Uses Vercel AI SDK (`ai` package) for streaming
2. **Server-Sent Events (SSE)** - Real-time streaming responses
3. **Tool Integration** - 4 custom tools (getWeather, createDocument, updateDocument, requestSuggestions)
4. **Rate Limiting** - Per-user message limits
5. **Usage Tracking** - TokenLens integration for cost tracking
6. **Resumable Streams** - Redis-based stream resumption (optional)
7. **Title Generation** - Async title generation for new chats
8. **Geolocation** - Vercel Functions geolocation API

## Current Implementation Analysis

### Request Flow

```
1. Validate request body (PostRequestBody schema)
2. Authenticate user (NextAuth session)
3. Check rate limits (messages per day)
4. Get or create chat
   - If exists: Fetch messages, validate ownership
   - If new: Generate title, create chat
5. Convert DB messages to UI messages
6. Get geolocation (Vercel Functions)
7. Save user message to database
8. Create stream ID
9. Stream AI response:
   - Use AI SDK streamText()
   - Apply tools (getWeather, createDocument, etc.)
   - Track usage (TokenLens)
   - Save assistant messages on finish
10. Return SSE stream
```

### Key Dependencies

#### TypeScript/Next.js Specific
- `ai` package (Vercel AI SDK) - **No Python equivalent**
- `@vercel/functions` - Geolocation API
- `resumable-stream` - Redis-based stream resumption
- `tokenlens` - Usage tracking
- NextAuth session handling

#### Database Operations
- `getChatById()` - ✅ Already in FastAPI
- `getMessagesByChatId()` - ⚠️ Need to implement
- `saveChat()` - ⚠️ Need to implement
- `saveMessages()` - ⚠️ Need to implement
- `createStreamId()` - ⚠️ Need to implement
- `updateChatLastContextById()` - ⚠️ Need to implement
- `getMessageCountByUserId()` - ⚠️ Need to implement (for rate limiting)

#### AI/Tools
- `myProvider` - AI provider wrapper
- `systemPrompt()` - System prompt generation
- `convertToModelMessages()` - Message conversion
- `convertToUIMessages()` - UI message conversion
- Tools: `getWeather`, `createDocument`, `updateDocument`, `requestSuggestions`

## Migration Strategy

### Phase 1: Foundation (2-3 hours) ✅ Prerequisites

**Goal**: Set up basic infrastructure

1. **Database Query Functions**
   - [ ] `get_messages_by_chat_id()` - Fetch messages for a chat
   - [ ] `save_chat()` - Create new chat
   - [ ] `save_messages()` - Save messages to database
   - [ ] `create_stream_id()` - Create stream ID entry
   - [ ] `update_chat_last_context_by_id()` - Update chat context
   - [ ] `get_message_count_by_user_id()` - Count messages for rate limiting

2. **Python AI SDK Setup**
   - [ ] Choose Python AI SDK (options: `openai`, `anthropic`, or wrapper)
   - [ ] Set up AI provider configuration
   - [ ] Implement streaming response handler

3. **Basic Endpoint Structure**
   - [ ] Request validation (Pydantic models)
   - [ ] Authentication check
   - [ ] Basic streaming response (placeholder)

### Phase 2: Core Chat Logic (2-3 hours)

**Goal**: Implement basic chat functionality without tools

1. **Chat Management**
   - [ ] Get or create chat logic
   - [ ] Message fetching and conversion
   - [ ] User message saving

2. **AI Streaming**
   - [ ] Set up AI SDK streaming
   - [ ] Convert messages to AI SDK format
   - [ ] Stream text responses (SSE format)
   - [ ] Save assistant messages on completion

3. **Title Generation**
   - [ ] Implement title generation (can be async/background task)
   - [ ] Or skip initially and use placeholder

### Phase 3: Rate Limiting & Usage Tracking (1-2 hours)

**Goal**: Add rate limiting and usage tracking

1. **Rate Limiting**
   - [ ] Implement `get_message_count_by_user_id()` query
   - [ ] Check against user entitlements
   - [ ] Return appropriate error on limit exceeded

2. **Usage Tracking**
   - [ ] Track token usage from AI responses
   - [ ] Store usage in chat `lastContext` field
   - [ ] Optional: TokenLens integration (can be skipped initially)

### Phase 4: Tool Integration (3-4 hours) ⚠️ Most Complex

**Goal**: Migrate AI tools to Python

1. **Tool Infrastructure**
   - [ ] Set up tool calling in Python AI SDK
   - [ ] Create tool handler framework

2. **Migrate Tools** (in order of complexity):
   - [ ] **getWeather** - Simplest (external API call)
   - [ ] **createDocument** - Medium (database + API response)
   - [ ] **updateDocument** - Medium (database + API response)
   - [ ] **requestSuggestions** - Complex (AI call + database)

3. **Tool Response Formatting**
   - [ ] Convert tool results to UI message format
   - [ ] Stream tool results as SSE events

### Phase 5: Advanced Features (Optional, 1-2 hours)

**Goal**: Add optional features

1. **Geolocation**
   - [ ] Get geolocation from request headers (or skip)
   - [ ] Pass to system prompt

2. **Resumable Streams**
   - [ ] Set up Redis connection
   - [ ] Implement stream resumption logic
   - [ ] Or skip initially (commented out in Next.js)

3. **Error Handling**
   - [ ] Comprehensive error handling
   - [ ] Gateway credit card error detection
   - [ ] Fallback error messages

## Technical Decisions

### 1. Python AI SDK Choice

**Options:**
- **OpenAI SDK** - Direct, but need to wrap for xAI
- **Anthropic SDK** - If using Claude
- **Custom wrapper** - For xAI/grok models
- **LangChain** - Overkill but flexible

**Recommendation**: Use `openai` SDK with custom base URL for xAI, or create a simple wrapper.

### 2. Streaming Implementation

**Options:**
- **FastAPI StreamingResponse** - Native SSE support ✅
- **Custom SSE generator** - More control
- **WebSockets** - Overkill for this use case

**Recommendation**: Use FastAPI `StreamingResponse` with async generator.

### 3. Tool Migration Strategy

**Options:**
- **Migrate all tools** - Complete but time-consuming
- **Migrate incrementally** - Start with getWeather, add others later
- **Skip tools initially** - Get basic chat working first

**Recommendation**: Incremental - start with getWeather, add others in subsequent phases.

### 4. Title Generation

**Options:**
- **Synchronous** - Generate before creating chat (slower)
- **Asynchronous** - Generate in background, update later
- **Skip initially** - Use placeholder "New Chat"

**Recommendation**: Skip initially, use placeholder, add async generation later.

## Implementation Checklist

### Database Layer
- [ ] `get_messages_by_chat_id()` query function
- [ ] `save_chat()` query function
- [ ] `save_messages()` query function
- [ ] `create_stream_id()` query function
- [ ] `update_chat_last_context_by_id()` query function
- [ ] `get_message_count_by_user_id()` query function

### API Layer
- [ ] Request validation (Pydantic model)
- [ ] Authentication middleware
- [ ] Rate limiting check
- [ ] Chat get/create logic
- [ ] Message fetching and conversion
- [ ] User message saving
- [ ] AI streaming setup
- [ ] SSE response formatting
- [ ] Assistant message saving
- [ ] Usage tracking
- [ ] Error handling

### AI Integration
- [ ] AI SDK setup
- [ ] Provider configuration
- [ ] Message format conversion
- [ ] Streaming response handler
- [ ] System prompt generation
- [ ] Tool calling setup

### Tools (Incremental)
- [ ] getWeather tool
- [ ] createDocument tool
- [ ] updateDocument tool
- [ ] requestSuggestions tool

### Testing
- [ ] Unit tests for query functions
- [ ] Integration tests for endpoint
- [ ] Test streaming responses
- [ ] Test tool calling
- [ ] Test rate limiting
- [ ] Test error scenarios

## Risk Assessment

### High Risk Areas
1. **AI SDK Compatibility** - Python AI SDKs may not match TypeScript SDK exactly
2. **Tool Migration** - Complex logic in tools, especially requestSuggestions
3. **Streaming Format** - SSE format must match frontend expectations exactly
4. **Message Format** - UI message format must be identical

### Mitigation Strategies
1. **Incremental Migration** - Start simple, add complexity gradually
2. **Parallel Testing** - Keep Next.js endpoint active during migration
3. **Format Validation** - Test SSE format matches exactly
4. **Tool Stubs** - Start with tool stubs, implement incrementally

## Alternative Approaches

### Option 1: Hybrid Approach (Recommended for MVP)
- Keep AI streaming in Next.js
- Move database operations to FastAPI
- Use FastAPI as proxy to Next.js for AI calls

**Pros**: Faster to implement, less risk
**Cons**: Not fully migrated, still depends on Next.js

### Option 2: Full Migration (Recommended for Production)
- Migrate everything to FastAPI
- Use Python AI SDK
- Migrate all tools

**Pros**: Complete migration, better architecture
**Cons**: More time, higher risk

### Option 3: Defer Migration
- Keep chat endpoint in Next.js
- Migrate other endpoints first
- Revisit chat endpoint later

**Pros**: Lower risk, faster progress on other endpoints
**Cons**: Main feature still in Next.js

## Recommendation

**Start with Option 1 (Hybrid)** for MVP:
1. Move database operations to FastAPI
2. Keep AI streaming in Next.js initially
3. Gradually migrate AI logic

**Then move to Option 2 (Full Migration)**:
1. Once other endpoints are stable
2. Migrate AI streaming to Python
3. Migrate tools incrementally

## Estimated Timeline

- **Phase 1 (Foundation)**: 2-3 hours
- **Phase 2 (Core Logic)**: 2-3 hours
- **Phase 3 (Rate Limiting)**: 1-2 hours
- **Phase 4 (Tools)**: 3-4 hours
- **Phase 5 (Advanced)**: 1-2 hours (optional)

**Total: 9-14 hours** for full migration

**MVP (without tools)**: 5-8 hours

## Next Steps

1. **Decide on approach** (Hybrid vs Full Migration)
2. **Start with Phase 1** - Database query functions
3. **Test incrementally** - Each phase should be testable
4. **Document as you go** - Keep track of decisions and issues

## Questions to Answer

1. Should we use a hybrid approach initially?
2. Which Python AI SDK should we use?
3. Should we migrate tools immediately or defer?
4. Do we need resumable streams in FastAPI?
5. How do we handle geolocation in FastAPI?
