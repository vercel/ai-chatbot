# AISuite Evaluation for Streaming Migration

## Overview

Evaluating whether [aisuite](https://github.com/andrewyng/aisuite) can be used to abstract the AI provider for the streaming migration.

## Current Setup

- **Provider**: xAI (Grok models)
- **Gateway**: Vercel AI Gateway (`@ai-sdk/gateway`)
- **Models**:
  - `chat-model` → `xai/grok-2-vision-1212`
  - `chat-model-reasoning` → `xai/grok-3-mini`
  - `title-model` → `xai/grok-2-1212`
  - `artifact-model` → `xai/grok-2-1212`

## AISuite Support Status

### ✅ Supported Providers
- OpenAI
- Anthropic
- Google
- Hugging Face
- AWS
- Cohere
- Mistral
- Ollama

### ❌ Not Supported (Currently)
- **xAI** - Not in the supported providers list

## Options

### Option 1: Add xAI Provider to AISuite ⚠️ (Medium Effort)

**Pros:**
- Unified interface for all providers
- Automatic tool execution
- Easy to switch providers later

**Cons:**
- Need to implement xAI provider adapter
- Need to verify SSE format compatibility
- Additional dependency

**Implementation:**
```python
# Would need to create: aisuite/providers/xai_provider.py
class XaiProvider(BaseProvider):
    def chat_completions_create(self, ...):
        # Call xAI API or Vercel Gateway
        ...
```

### Option 2: Direct xAI API Calls ✅ (Recommended)

**Pros:**
- No additional dependencies
- Direct control over API calls
- Can use Vercel Gateway if `AI_GATEWAY_URL` is set
- Full control over streaming format

**Cons:**
- Need to implement streaming ourselves
- More code to maintain

**Implementation:**
```python
# Direct xAI API
async with httpx.AsyncClient() as client:
    response = await client.post(
        "https://api.x.ai/v1/chat/completions",
        headers={"Authorization": f"Bearer {XAI_API_KEY}"},
        json={"model": "grok-2-vision-1212", "messages": messages, "stream": True},
    )
```

### Option 3: Hybrid Approach 🔄

**Use aisuite for:**
- Tool execution abstraction (if compatible)
- Future provider switching

**Use direct API for:**
- xAI streaming (current provider)
- SSE format control

## Recommendation

**Use Direct xAI API Calls** (Option 2) because:

1. **xAI Not Supported**: aisuite doesn't support xAI natively
2. **Vercel Gateway**: Already using Vercel AI Gateway, which is another abstraction layer
3. **Streaming Format**: Need precise control over SSE format for Vercel AI SDK compatibility
4. **Simplicity**: Direct API calls are simpler for a single provider
5. **Reference Code**: We have the Vercel Python streaming reference that shows exactly how to format SSE

## If You Want to Use AISuite

### Steps:
1. **Add xAI Provider** to aisuite (contribute back to project)
2. **Verify Streaming Format** matches Vercel AI SDK expectations
3. **Test Tool Execution** with automatic `max_turns`
4. **Handle Vercel Gateway** integration (if needed)

### Code Example (if xAI support added):
```python
import aisuite as ai

client = ai.Client()
response = client.chat.completions.create(
    model="xai:grok-2-vision-1212",  # Would need xAI provider
    messages=messages,
    tools=[get_weather, create_document, ...],
    max_turns=5,  # Automatic tool execution
    stream=True,
)
```

## Conclusion

**For now**: Use **direct xAI API calls** with the Vercel Python streaming reference.

**Future consideration**: If you plan to support multiple providers (not just xAI), then adding xAI support to aisuite or using aisuite for other providers makes sense.

The direct API approach gives you:
- ✅ Full control
- ✅ No additional dependencies
- ✅ Precise SSE format control
- ✅ Works with existing Vercel Gateway setup
