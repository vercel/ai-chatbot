# SSE Streaming Integration for Tools

## Overview

Tools can now emit SSE events for real-time streaming to the frontend. This enables features like:
- Real-time document content streaming (text, code, sheet deltas)
- Incremental suggestion display
- Live artifact updates

## Architecture

### How It Works

1. **Tool Execution**: When a tool is called during streaming, it receives an `_sse_writer` parameter
2. **SSE Writer**: Tools can call `sse_writer(event)` to emit SSE-formatted events
3. **Event Collection**: Events are collected during tool execution
4. **Event Yielding**: Collected events are yielded after tool execution completes

### Flow

```
AI Stream → Tool Call Requested → Tool Executed
                                    ↓
                            Tool emits SSE events via sse_writer
                                    ↓
                            Events collected in tool_sse_events
                                    ↓
                            Events yielded to frontend
                                    ↓
                            Tool result yielded
```

## Implementation

### 1. Stream Utility (`app/utils/stream.py`)

The `stream_text` function now:
- Creates an SSE writer for each tool execution
- Passes `_sse_writer` parameter to tools
- Collects events emitted by tools
- Yields collected events before tool result

```python
# Create SSE writer for tool execution
tool_sse_events = []

def tool_sse_writer(event: str):
    """Collect SSE events emitted by tools."""
    tool_sse_events.append(event)

# Execute tool with SSE writer
tool_result = await tool_function(
    **parsed_arguments,
    _sse_writer=tool_sse_writer,
)

# Yield collected events
for event in tool_sse_events:
    yield event
```

### 2. Tool Wrappers (`app/api/v1/chat_stream.py`)

Tool wrappers extract `_sse_writer` and pass it to tools:

```python
async def create_document_wrapper(**kwargs):
    sse_writer = kwargs.pop("_sse_writer", None)
    return await create_document_tool(
        title=kwargs["title"],
        kind=kwargs["kind"],
        user_id=str(user_id),
        db_session=db,
        sse_writer=sse_writer,  # Passed to tool
    )
```

### 3. Tool Implementation (`app/ai/tools/document.py`)

Tools use the SSE writer to emit events:

```python
async def create_document_tool(
    title: str,
    kind: str,
    user_id: str,
    db_session: Any,
    sse_writer: Optional[Any] = None,
) -> Dict[str, Any]:
    # Emit SSE events
    if sse_writer:
        sse_writer(format_sse({"type": "data-kind", "data": kind}))
        sse_writer(format_sse({"type": "data-id", "data": document_id}))
        sse_writer(format_sse({"type": "data-title", "data": title}))
        sse_writer(format_sse({"type": "data-clear", "data": None}))

    # Generate content (streams deltas)
    content = await _generate_document_content(title, kind, sse_writer)

    # Emit finish event
    if sse_writer:
        sse_writer(format_sse({"type": "data-finish", "data": None}))
```

## SSE Event Types

### Document Events

- `data-kind`: Document kind ("text", "code", "sheet")
- `data-id`: Document ID
- `data-title`: Document title
- `data-clear`: Clear artifact (null)
- `data-textDelta`: Text content delta
- `data-codeDelta`: Code content delta
- `data-sheetDelta`: Sheet/CSV content delta
- `data-finish`: Document generation complete

### Suggestion Events

- `data-suggestion`: New suggestion (includes full suggestion object)

## Tool Support Status

| Tool | SSE Support | Events Emitted |
|------|-------------|----------------|
| `getWeather` | ❌ No | N/A (simple result) |
| `createDocument` | ✅ Yes | kind, id, title, clear, deltas, finish |
| `updateDocument` | ✅ Yes | clear, deltas, finish |
| `requestSuggestions` | ✅ Yes | suggestion (per suggestion) |

## Example: Document Creation Flow

1. **Tool Called**: `createDocument(title="Python Guide", kind="text")`
2. **SSE Events Emitted**:
   ```
   data: {"type": "data-kind", "data": "text"}
   data: {"type": "data-id", "data": "uuid-here"}
   data: {"type": "data-title", "data": "Python Guide"}
   data: {"type": "data-clear", "data": null}
   data: {"type": "data-textDelta", "data": "# Python"}
   data: {"type": "data-textDelta", "data": " Guide\n\n"}
   ... (more deltas)
   data: {"type": "data-finish", "data": null}
   ```
3. **Tool Result**: `{"id": "...", "title": "...", "kind": "...", "content": "..."}`

## Testing

To test SSE streaming:

1. **Start FastAPI server**
2. **Send chat request** that triggers a tool (e.g., "Create a document about Python")
3. **Monitor SSE stream** for tool-emitted events
4. **Verify frontend** receives and displays events in real-time

## Known Limitations

1. **Event Ordering**: Events are collected during tool execution and yielded after completion. For very long-running tools, there may be a delay.
2. **Error Handling**: If tool execution fails, collected events are still yielded (may need cleanup).
3. **Async Tool Execution**: Tools must be async and properly handle the `_sse_writer` parameter.

## Future Improvements

1. **Streaming During Execution**: Yield events as they're emitted (requires async generator pattern)
2. **Error Recovery**: Handle partial tool execution failures
3. **Event Filtering**: Allow tools to specify which events to emit
4. **Progress Events**: Add progress indicators for long-running tools

