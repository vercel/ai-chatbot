# Guide: Adding New AI Tools

This guide explains how to implement new tools for the AI chatbot in both the backend (FastAPI/Python) and frontend (Next.js/TypeScript).

## Overview

Tools allow the AI to perform actions beyond text generation, such as:
- Fetching external data (weather, APIs)
- Creating/updating documents
- Performing calculations
- Interacting with databases

## Architecture

```
AI Request → Tool Call → Tool Execution → Result → AI Response
                ↓
         SSE Events (optional)
                ↓
         Frontend Updates
```

## Backend Implementation (Python/FastAPI)

### Step 1: Create Tool File

Create a new file in `backend/app/ai/tools/`:

```python
# backend/app/ai/tools/my_tool.py
"""
My Tool - Description of what the tool does.
"""
from typing import Any, Dict, Optional

async def my_tool_function(
    param1: str,
    param2: Optional[int] = None,
    user_id: Optional[str] = None,
    db_session: Optional[Any] = None,
    sse_writer: Optional[Any] = None,
) -> Dict[str, Any]:
    """
    Tool function that performs the action.

    Args:
        param1: Description of param1
        param2: Description of param2 (optional)
        user_id: User ID (if needed for auth/ownership)
        db_session: Database session (if needed for DB operations)
        sse_writer: SSE event writer (if you need real-time frontend updates)

    Returns:
        Dictionary with result or error
    """
    try:
        # Your tool logic here
        result = {
            "success": True,
            "data": "your result data"
        }
        return result
    except Exception as e:
        return {"error": f"Tool failed: {str(e)}"}


# Tool definition for OpenAI format
MY_TOOL_DEFINITION = {
    "type": "function",
    "function": {
        "name": "myTool",  # Must match the key in tools dict (camelCase)
        "description": "Clear description of what the tool does and when to use it.",
        "parameters": {
            "type": "object",
            "properties": {
                "param1": {
                    "type": "string",
                    "description": "Description of param1"
                },
                "param2": {
                    "type": "number",
                    "description": "Description of param2"
                },
            },
            "required": ["param1"],  # List required parameters
        },
    },
}
```

### Step 2: Export Tool in `__init__.py`

Add to `backend/app/ai/tools/__init__.py`:

```python
from app.ai.tools.my_tool import (
    MY_TOOL_DEFINITION,
    my_tool_function,
)

__all__ = [
    # ... existing tools ...
    "my_tool_function",
    "MY_TOOL_DEFINITION",
]
```

### Step 3: Register Tool in Stream Endpoint

In `backend/app/api/v1/chat_stream.py`:

#### 3a. Import the tool:

```python
from app.ai.tools import (
    # ... existing imports ...
    MY_TOOL_DEFINITION,
    my_tool_function,
)
```

#### 3b. Add to tool definitions list (around line 222):

```python
tool_definitions = [
    GET_WEATHER_TOOL_DEFINITION,
    CREATE_DOCUMENT_TOOL_DEFINITION,
    UPDATE_DOCUMENT_TOOL_DEFINITION,
    REQUEST_SUGGESTIONS_TOOL_DEFINITION,
    MY_TOOL_DEFINITION,  # Add your tool
]
```

#### 3c. Create wrapper function (around line 266):

```python
async def my_tool_wrapper(**kwargs):
    """
    Wrapper for my_tool that handles:
    - Extracting _sse_writer if needed
    - Passing user_id and db_session
    - Calling the actual tool function
    """
    sse_writer = kwargs.pop("_sse_writer", None)  # Remove if tool doesn't need SSE
    return await my_tool_function(
        param1=kwargs["param1"],
        param2=kwargs.get("param2"),
        user_id=str(user_id),  # From outer scope
        db_session=db,  # From outer scope
        sse_writer=sse_writer,  # Optional
    )
```

#### 3d. Add to tools dict (around line 300):

```python
tools = {
    "getWeather": get_weather_wrapper,
    "createDocument": create_document_wrapper,
    "updateDocument": update_document_wrapper,
    "requestSuggestions": request_suggestions_wrapper,
    "myTool": my_tool_wrapper,  # Add your tool (camelCase key)
}
```

#### 3e. Add to active tools list (if needed):

If you want to conditionally enable/disable the tool based on model:

```python
# In stream_text call, you might need to filter tools
# Currently all tools are active for non-reasoning models
# This is handled in the Next.js version with experimental_activeTools
```

### Step 4: SSE Events (Optional)

If your tool needs to send real-time updates to the frontend:

```python
from app.utils.stream import format_sse

if sse_writer:
    # Send SSE events
    sse_writer(format_sse({
        "type": "data-custom-event",
        "data": "your data"
    }))
```

**Available SSE event types** (see `lib/types.ts` for full list):
- `data-kind`: Document kind
- `data-id`: Document/artifact ID
- `data-title`: Title
- `data-clear`: Clear artifact
- `data-finish`: Finish artifact
- `textDelta`: Text content delta
- `codeDelta`: Code content delta
- `sheetDelta`: Sheet content delta
- `suggestion`: Suggestion data

## Frontend Implementation (Next.js/TypeScript)

### Step 1: Create Tool File

Create a new file in `lib/ai/tools/`:

```typescript
// lib/ai/tools/my-tool.ts
import { tool } from "ai";
import { z } from "zod";

type MyToolProps = {
  session: Session;  // If you need user session
  dataStream: UIMessageStreamWriter<ChatMessage>;  // If you need SSE
};

export const myTool = ({ session, dataStream }: MyToolProps) =>
  tool({
    description: "Clear description of what the tool does and when to use it.",
    inputSchema: z.object({
      param1: z.string().describe("Description of param1"),
      param2: z.number().optional().describe("Description of param2"),
    }),
    execute: async ({ param1, param2 }) => {
      // Your tool logic here

      // Optional: Send SSE events to frontend
      if (dataStream) {
        dataStream.write({
          type: "data-custom-event",
          data: "your data",
          transient: true,  // If event shouldn't be saved in chat history
        });
      }

      return {
        success: true,
        data: "your result data"
      };
    },
  });
```

### Step 2: Register Tool in Stream Endpoint

In `app/api/chat/stream/route.ts`:

#### 2a. Import the tool:

```typescript
import { myTool } from "@/lib/ai/tools/my-tool";
```

#### 2b. Add to tools object (around line 166):

```typescript
tools: {
  getWeather,
  createDocument: createDocument({ session, dataStream }),
  updateDocument: updateDocument({ session, dataStream }),
  requestSuggestions: requestSuggestions({ session, dataStream }),
  myTool: myTool({ session, dataStream }),  // Add your tool
},
```

#### 2c. Add to active tools list (around line 156):

```typescript
experimental_activeTools:
  selectedChatModel === "chat-model-reasoning"
    ? []
    : [
        "getWeather",
        "createDocument",
        "updateDocument",
        "requestSuggestions",
        "myTool",  // Add your tool (camelCase)
      ],
```

### Step 3: Update TypeScript Types

In `lib/types.ts`:

#### 3a. Add tool type (around line 20):

```typescript
type myToolType = InferUITool<ReturnType<typeof myTool>>;
```

#### 3b. Add to ChatTools type (around line 26):

```typescript
export type ChatTools = {
  getWeather: weatherTool;
  createDocument: createDocumentTool;
  updateDocument: updateDocumentTool;
  requestSuggestions: requestSuggestionsTool;
  myTool: myToolType;  // Add your tool
};
```

#### 3c. Add custom UI data types (if needed, around line 33):

```typescript
export type CustomUIDataTypes = {
  // ... existing types ...
  myCustomEvent: string;  // If you added new SSE event types
};
```

## Important Notes

### 1. Tool Naming Convention
- **Backend**: Use `snake_case` for function names, `UPPER_SNAKE_CASE` for definitions
- **Frontend**: Use `camelCase` for tool names (matches AI SDK convention)
- **Tool Definition**: The `name` field in the definition must match the key in the `tools` dict

### 2. Parameter Mapping
- Tool parameters are passed as keyword arguments in Python
- Parameter names should match between backend and frontend
- Use `Optional` types for optional parameters

### 3. Database Sessions
- Always create a new session in background tasks
- Don't reuse the request session after the response is sent
- Use `AsyncSessionLocal()` for new sessions

### 4. SSE Events
- Use `format_sse()` in Python backend
- Use `dataStream.write()` in TypeScript frontend
- Events are sent in real-time during tool execution
- Use `transient: true` for events that shouldn't be saved in chat history

### 5. Error Handling
- Always return a dictionary with an `error` key on failure
- Don't raise exceptions (they'll break the stream)
- Provide helpful error messages

### 6. Testing
- Test tools independently before integrating
- Test with different parameter combinations
- Test error cases (invalid input, network failures, etc.)
- Verify SSE events are received correctly

## Example: Complete Tool Implementation

See existing tools for reference:
- **Simple tool** (no DB, no SSE): `backend/app/ai/tools/weather.py`
- **Tool with DB**: `backend/app/ai/tools/document.py`
- **Tool with SSE**: `backend/app/ai/tools/suggestions.py`

## Checklist

When adding a new tool:

### Backend
- [ ] Create tool file in `backend/app/ai/tools/`
- [ ] Implement tool function with proper type hints
- [ ] Create tool definition (OpenAI format)
- [ ] Export in `__init__.py`
- [ ] Import in `chat_stream.py`
- [ ] Add to `tool_definitions` list
- [ ] Create wrapper function
- [ ] Add to `tools` dict
- [ ] Test tool execution
- [ ] Add logging for debugging

### Frontend
- [ ] Create tool file in `lib/ai/tools/`
- [ ] Implement tool with `tool()` from `ai` package
- [ ] Import in `app/api/chat/stream/route.ts`
- [ ] Add to `tools` object
- [ ] Add to `experimental_activeTools` array
- [ ] Update TypeScript types in `lib/types.ts`
- [ ] Test tool execution
- [ ] Handle SSE events if needed

### Both
- [ ] Ensure parameter names match
- [ ] Ensure tool names match (camelCase)
- [ ] Test error handling
- [ ] Document tool purpose and usage
- [ ] Update any relevant documentation

