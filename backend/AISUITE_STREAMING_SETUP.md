# AISuite + OpenAI Streaming Setup

## Overview

This setup uses [aisuite](https://github.com/andrewyng/aisuite) to abstract the AI provider (OpenAI) while adapting the streaming output to match the Vercel AI SDK format.

## Installation

1. **Install aisuite**:
   ```bash
   cd backend
   uv add aisuite
   # Or with pip:
   pip install aisuite
   ```

2. **Set OpenAI API Key**:
   ```bash
   # In backend/.env
   OPENAI_API_KEY=sk-...
   ```

## Architecture

### Components

1. **`app/ai/client.py`**: AI client wrapper using aisuite
   - Maps internal model IDs to aisuite model names
   - Provides `get_ai_client()` and `get_model_name()`

2. **`app/utils/stream.py`**: Streaming utility
   - Uses aisuite for API calls
   - Formats output as Vercel AI SDK SSE events
   - Handles tool execution manually (not using `max_turns`)

### Model Mapping

| Internal ID | AISuite Model | Description |
|------------|---------------|-------------|
| `chat-model` | `openai:gpt-4o` | Main chat model |
| `chat-model-reasoning` | `openai:gpt-4o` | Reasoning model |
| `title-model` | `openai:gpt-4o` | Title generation |
| `artifact-model` | `openai:gpt-4o` | Artifact generation |

## Usage

### Basic Streaming

```python
from app.ai.client import get_ai_client, get_model_name
from app.utils.stream import stream_text, patch_response_with_headers
from fastapi.responses import StreamingResponse

client = get_ai_client()
model = get_model_name("chat-model")

messages = [
    {"role": "user", "content": "Hello!"}
]

async def stream_generator():
    async for event in stream_text(
        client=client,
        model=model,
        messages=messages,
        system="You are a helpful assistant.",
    ):
        yield event

response = StreamingResponse(
    stream_generator(),
    media_type="text/event-stream",
)
return patch_response_with_headers(response)
```

### With Tools

```python
from app.ai.tools import get_weather, create_document

# Define tools as Python functions
tools = {
    "getWeather": get_weather,
    "createDocument": create_document,
}

# Define tool schemas in OpenAI format
tool_definitions = [
    {
        "type": "function",
        "function": {
            "name": "getWeather",
            "description": "Get weather for a location",
            "parameters": {
                "type": "object",
                "properties": {
                    "location": {"type": "string"},
                },
                "required": ["location"],
            },
        },
    },
]

async def stream_generator():
    async for event in stream_text(
        client=client,
        model=model,
        messages=messages,
        tools=tools,
        tool_definitions=tool_definitions,
    ):
        yield event
```

## SSE Event Format

The streaming utility emits events in Vercel AI SDK format:

```
data: {"type": "start", "messageId": "msg-..."}\n\n
data: {"type": "text-start", "id": "text-1"}\n\n
data: {"type": "text-delta", "id": "text-1", "delta": "Hello"}\n\n
data: {"type": "text-delta", "id": "text-1", "delta": " world"}\n\n
data: {"type": "text-end", "id": "text-1"}\n\n
data: {"type": "finish", "messageMetadata": {...}}\n\n
data: [DONE]\n\n
```

## Tool Execution

Tools are executed manually (not using aisuite's `max_turns`):
1. LLM requests a tool call → emit `tool-input-start`
2. Tool arguments stream in → emit `tool-input-delta`
3. Arguments complete → emit `tool-input-available`
4. Execute tool → emit `tool-output-available` or `tool-output-error`
5. Continue streaming with tool results

## Next Steps

1. ✅ Install aisuite
2. ✅ Create AI client wrapper
3. ✅ Create streaming utility
4. ⏳ Port tools to Python
5. ⏳ Update FastAPI chat endpoint
6. ⏳ Test end-to-end

